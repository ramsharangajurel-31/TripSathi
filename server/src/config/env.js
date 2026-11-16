// Reads and validates the environment ONCE at start-up. If anything is
// wrong, the server stops with a clear message instead of failing later.

import dotenv from "dotenv";
import { z } from "zod";

import { inspectMongoUri } from "./mongoUri.js";

dotenv.config();

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

// The database address is required everywhere except in automated tests,
// which never touch a real database.
if (data.NODE_ENV !== "test") {
  const check = inspectMongoUri(data.MONGODB_URI);

  if (!data.MONGODB_URI || !check.ok) {
    console.error(
      `Invalid environment configuration:\n  - MONGODB_URI: ${
        data.MONGODB_URI ? check.reason : "is required (see .env.example)."
      }`
    );
    process.exit(1);
  }
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
});