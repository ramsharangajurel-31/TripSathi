// Reads and validates the environment ONCE at start-up. If anything is
// wrong, the server stops with a clear message instead of failing later.

import dotenv from "dotenv";
import { z } from "zod";

import { inspectMongoUri } from "./mongoUri.js";

dotenv.config();

// "KEY=" in a .env file arrives as "". Treat that as "not set".
const blankIsUnset = (schema) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100000).default(300),
  MONGODB_URI: z.string().trim().optional(),

  JWT_ACCESS_SECRET: blankIsUnset(z.string().trim().min(32, "must be at least 32 characters").optional()),
  ACCESS_TOKEN_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  REFRESH_GRACE_SECONDS: z.coerce.number().int().min(0).max(60).default(10),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: blankIsUnset(z.string().trim().optional()),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
  );
  console.error(`Invalid environment configuration:\n${lines.join("\n")}`);
  process.exit(1);
}

const data = parsed.data;
const problems = [];

// Everything below is required except in automated tests, which supply
// their own safe values.
if (data.NODE_ENV !== "test") {
  const check = inspectMongoUri(data.MONGODB_URI);
  if (!data.MONGODB_URI) problems.push("MONGODB_URI: is required (see .env.example).");
  else if (!check.ok) problems.push(`MONGODB_URI: ${check.reason}`);

  const EXAMPLE_SECRET = /change[-_ ]?me|your[-_ ]?secret|replace|example|secret[-_ ]?here|^(.)\1+$/i;
  if (!data.JWT_ACCESS_SECRET) {
    problems.push("JWT_ACCESS_SECRET: is required (see .env.example for how to generate one).");
  } else if (EXAMPLE_SECRET.test(data.JWT_ACCESS_SECRET)) {
    problems.push("JWT_ACCESS_SECRET: still looks like example text. Generate a random one.");
  }
}

if (problems.length > 0) {
  console.error(`Invalid environment configuration:\n${problems.map((line) => `  - ${line}`).join("\n")}`);
  process.exit(1);
}

// "*" is never allowed: cookies are used for sign-in, and browsers reject
// a wildcard together with credentials.
const clientOrigins = data.CLIENT_ORIGIN.split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => {
    try {
      const url = new URL(item);
      if (url.origin === "null" || item === "*") throw new Error("not an origin");
      return url.origin;
    } catch {
      console.error(`Invalid environment configuration:\n  - CLIENT_ORIGIN: "${item}" is not a valid origin (example: http://localhost:5173)`);
      process.exit(1);
    }
  });

// Used ONLY when NODE_ENV is "test" (any other environment exits above).
const TEST_ONLY_SECRET = "test-only-secret-never-used-outside-automated-tests-0123456789";

export const env = Object.freeze({
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === "production",
  isTest: data.NODE_ENV === "test",
  port: data.PORT,
  mongoUri: data.MONGODB_URI || null,
  clientOrigins,
  logLevel: data.LOG_LEVEL,
  trustProxyHops: data.TRUST_PROXY_HOPS,
  rateLimit: Object.freeze({
    windowMs: data.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: data.RATE_LIMIT_MAX,
  }),
  auth: Object.freeze({
    accessSecret: data.JWT_ACCESS_SECRET ?? TEST_ONLY_SECRET,
    accessTtlSeconds: data.ACCESS_TOKEN_MINUTES * 60,
    refreshTtlMs: data.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    refreshGraceMs: data.REFRESH_GRACE_SECONDS * 1000,
    bcryptCost: data.BCRYPT_COST,
    cookie: Object.freeze({
      sameSite: data.COOKIE_SAMESITE,
      domain: data.COOKIE_DOMAIN,
      // SameSite=None is only honoured by browsers together with Secure.
      secure: data.NODE_ENV === "production" || data.COOKIE_SAMESITE === "none",
    }),
  }),
});