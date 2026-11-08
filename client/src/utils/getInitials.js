/**
 * "Ram Sharan Gajurel" -> "RG", "Sita" -> "S", "" -> "?"
 * Used for avatar circles when a user has no profile photo.
 */
export default function getInitials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  return (
    words[0].charAt(0) + words[words.length - 1].charAt(0)
  ).toUpperCase();
}