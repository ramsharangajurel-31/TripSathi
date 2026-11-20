import { badRequest } from "../utils/httpError.js";

/**
 * Validates parts of the request with Zod schemas:
 *
 *   router.get("/", validate({ query: listQuery }), controller)
 *
 * The cleaned values are placed in req.valid.query / .params / .body. Use
 * those, never req.query directly. Any problem gives a 400 listing every
 * field that is wrong.
 */
export function validate(schemas) {
  return (req, res, next) => {
    const valid = {};
    const problems = [];

    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[location]);

      if (result.success) {
        valid[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          problems.push({ field: issue.path.join(".") || `(${location})`, message: issue.message });
        }
      }
    }

    if (problems.length > 0) {
      return next(badRequest("The request is not valid.", problems, "VALIDATION_ERROR"));
    }

    req.valid = valid;
    return next();
  };
}