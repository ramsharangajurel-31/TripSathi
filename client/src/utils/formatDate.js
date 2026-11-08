// ==========================================================================
// TripSathi – Date helpers
//
// Trip dates are stored as plain "YYYY-MM-DD" strings, the same format an
// <input type="date"> produces. They are parsed as LOCAL dates (never UTC),
// so a trip on 12 Nov never shifts to 11 Nov because of the time zone.
// ==========================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

const fullFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "2026-11-12" -> Date (local midnight), or null when invalid. */
export function parseDate(value) {
  if (!value) return null;
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date -> "YYYY-MM-DD" using local time. */
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const todayISO = () => toISODate(new Date());

/** Adds (or subtracts) whole days to a "YYYY-MM-DD" string. */
export function addDays(isoDate, amount) {
  const date = parseDate(isoDate);
  if (!date) return "";
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function diffInDays(from, to) {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

/** Days from today until the date (0 = today, negative = in the past). */
export const daysUntil = (isoDate) => diffInDays(todayISO(), isoDate);

/** "12 Nov 2026", or "—" when the value is missing or invalid. */
export function formatDate(value) {
  const date = parseDate(value);
  return date ? fullFormatter.format(date) : "—";
}

/** "Thu, 12 Nov" – used on itinerary day headers. */
export function formatWeekdayDate(value) {
  const date = parseDate(value);
  return date ? weekdayFormatter.format(date) : "—";
}

/** "12 Nov – 15 Nov 2026" (the year is shown once, on the end date). */
export function formatDateRange(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return "—";
  if (toISODate(startDate) === toISODate(endDate)) return fullFormatter.format(endDate);
  return `${shortFormatter.format(startDate)} – ${fullFormatter.format(endDate)}`;
}

/**
 * Friendly relative time for notifications: "Just now", "5 min ago",
 * "3 h ago", "Yesterday", "4 days ago", then a normal date after a week.
 * Accepts a full ISO timestamp.
 */
export function formatRelativeTime(isoDateTime, now = Date.now()) {
  const time = new Date(isoDateTime).getTime();
  if (Number.isNaN(time)) return "—";

  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 60) return "Just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return fullFormatter.format(new Date(time));
}