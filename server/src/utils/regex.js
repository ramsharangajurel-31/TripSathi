/** Makes text safe to use inside a regular expression (matches it literally). */
export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");