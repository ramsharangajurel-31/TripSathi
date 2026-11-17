/**
 * "Everest Region" -> "everest-region". Accents are removed. Text with no
 * Latin letters or digits (for example Devanagari) gives "", so the caller
 * must supply a slug by hand in that case.
 */
export function slugify(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}