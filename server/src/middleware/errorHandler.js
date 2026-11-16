import { env } from "../config/env.js";
import { sendError } from "../utils/apiResponse.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

/** Last route handler: anything that reaches it did not match a route. */
export function notFoundHandler(req, res) {
  sendError(res, 404, "NOT_FOUND", "Route not found.");
}

/**
 * Turns every error into the standard JSON error response. Details about an
 * unexpected (500) error stay in the server log and never reach the client,
 * except the stack trace in development.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on our side.";
  let details;

  if (error instanceof HttpError) {
    ({ status, code, message, details } = error);
  } else if (error?.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "The request body is not valid JSON.";
  } else if (error?.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "The request body is too large.";
  }

  if (status >= 500) {
    (req.log || logger).error({ err: error }, "Unhandled error");
    if (env.nodeEnv === "development") details = { stack: error?.stack };
  }

  return sendError(res, status, code, message, details);
}