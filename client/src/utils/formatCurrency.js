// Formats amounts as Nepali rupees, e.g. 125000 -> "NPR 1,25,000".
// Nepal uses the lakh/crore digit grouping, which the "en-IN" locale provides.

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/**
 * @param {number} amount   value in NPR
 * @param {object} options
 *   withSymbol  include the "NPR " prefix (default true)
 * @returns {string}  "NPR 40,000", or "—" when the value is not a valid number
 */
export function formatCurrency(amount, { withSymbol = true } = {}) {
  const value = Number(amount);

  // Show a dash rather than a misleading "NPR 0" or "NPR NaN".
  if (amount === null || amount === undefined || !Number.isFinite(value)) {
    return "—";
  }

  const formatted = numberFormatter.format(Math.round(value));
  return withSymbol ? `NPR ${formatted}` : formatted;
}

export default formatCurrency;