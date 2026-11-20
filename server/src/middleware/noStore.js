// Responses that carry account data must never be kept by a browser or a
// shared cache.
export function noStore(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}