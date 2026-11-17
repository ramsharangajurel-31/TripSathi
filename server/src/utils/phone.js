/**
 * Stores a Nepali mobile number as its 10 local digits:
 *   "+977 984-123-4567" -> "9841234567"
 * The +977 / 977 prefix is removed only when exactly 10 digits remain, so a
 * local number that happens to start with 977 is never damaged. Anything else
 * is returned compacted and left for validation to reject.
 */
export function normalizePhone(value) {
  const compact = String(value ?? "").replace(/[\s-]/g, "");
  const stripped = compact.replace(/^\+?977/, "");
  return stripped.length === 10 ? stripped : compact;
}