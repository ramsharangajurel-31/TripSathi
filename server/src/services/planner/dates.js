// Trip dates are plain "YYYY-MM-DD" strings. They are calculated in UTC, so
// the result never depends on the time zone of the server, and impossible
// dates (2026-02-31) are rejected instead of rolling into March.

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const NEPAL_OFFSET_MINUTES = 345; // UTC+5:45

/** "2026-11-20" -> milliseconds at UTC midnight, or null when invalid. */
export function parseDate(value) {
  const match = ISO_DATE.exec(String(value ?? ""));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return time;
}

export const toISODate = (time) => new Date(time).toISOString().slice(0, 10);

/** Adds (or subtracts) whole days. Returns "" for an invalid date. */
export function addDays(isoDate, amount) {
  const time = parseDate(isoDate);
  return time === null ? "" : toISODate(time + amount * DAY_MS);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). 0 if either is invalid. */
export function diffInDays(from, to) {
  const start = parseDate(from);
  const end = parseDate(to);
  return start === null || end === null ? 0 : Math.round((end - start) / DAY_MS);
}

/** Inclusive: 10 March to 13 March is 4 days. Never less than 1. */
export const getDurationDays = (departureDate, returnDate) =>
  Math.max(1, diffInDays(departureDate, returnDate) + 1);

/** Today's date in Nepal (UTC+5:45), as "YYYY-MM-DD". */
export const todayISO = (now = Date.now(), offsetMinutes = NEPAL_OFFSET_MINUTES) =>
  toISODate(now + offsetMinutes * 60_000);