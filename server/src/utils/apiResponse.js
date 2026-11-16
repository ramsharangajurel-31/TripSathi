// Every response has the same shape, so the frontend can handle them alike:
//   success: { "success": true,  "data": ..., "meta": { ... } }
//   failure: { "success": false, "error": { "code": "...", "message": "...", "details": ... } }

export function sendSuccess(res, data = null, { status = 200, meta } = {}) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(status).json({ success: false, error });
}