import { randomUUID } from "node:crypto";

import pinoHttp from "pino-http";

import { logger } from "../utils/logger.js";

// One log line per request, with a request id that is also sent back in the
// X-Request-Id header. The id is always generated here (a client-supplied id
// could be used to forge log entries). Health checks are not logged.
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (req, res, error) => {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: { ignore: (req) => req.url === "/api/health" },
});