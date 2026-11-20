// "NPR 1,25,000": Nepal groups digits in lakhs and crores, which the
// "en-IN" locale provides.

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** "NPR 36,225", or "—" when the value is missing or not a number. */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === "") return "—";

  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";

  return `NPR ${numberFormatter.format(Math.round(value))}`;
}