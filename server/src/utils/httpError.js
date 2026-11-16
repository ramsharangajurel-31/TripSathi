/**
 * An error that carries an HTTP status and a stable machine-readable code.
 * Throw it from anywhere; the error handler turns it into a JSON response.
 *
 *   throw notFound("Trip not found.");
 */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message = "Bad request.", details, code = "BAD_REQUEST") =>
  new HttpError(400, code, message, details);

export const unauthorized = (message = "You need to sign in.", code = "UNAUTHORIZED") =>
  new HttpError(401, code, message);

export const forbidden = (message = "You are not allowed to do this.", code = "FORBIDDEN") =>
  new HttpError(403, code, message);

export const notFound = (message = "Not found.", code = "NOT_FOUND") =>
  new HttpError(404, code, message);

export const conflict = (message = "This conflicts with existing data.", code = "CONFLICT") =>
  new HttpError(409, code, message);