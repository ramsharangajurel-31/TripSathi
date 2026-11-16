import pino from "pino";

import { env } from "../config/env.js";

// Structured (JSON) logs in production, readable logs in development, silent
// in tests. Cookies and authorization headers never reach the logs.
export const logger = pino({
  level: env.isTest ? "silent" : env.logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[redacted]",
  },
  ...(env.nodeEnv === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
        },
      }
    : {}),
});