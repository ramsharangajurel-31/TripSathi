// Checks a MongoDB connection string WITHOUT ever exposing its credentials.
// Pure functions: no database access, easy to test.

const PATTERN = /^mongodb(?:\+srv)?:\/\/([^/?]+)(?:\/([^?]*))?(?:\?.*)?$/;

// Example text that is easy to leave in by mistake: our own placeholders,
// Atlas's "<db_password>" and "<username>", and "USER:PASSWORD@CLUSTER".
const PLACEHOLDER =
  /your[-_ ]?(?:cluster|password|username|user)|<[^>]*>|^user:password@|@cluster\.mongodb\.net/i;

/**
 * Returns { ok: true, host, database, hasCredentials } for a usable string,
 * or { ok: false, reason } with a message that is safe to show (it never
 * repeats the string itself).
 */
export function inspectMongoUri(uri) {
  const text = String(uri || "").trim();
  const match = PATTERN.exec(text);

  if (!match) {
    return {
      ok: false,
      reason: 'It must start with "mongodb://" or "mongodb+srv://" and contain a host.',
    };
  }

    const [, authority, database = ""] = match;

  if (PLACEHOLDER.test(authority)) {
    return {
      ok: false,
      reason:
        'It still contains example text (such as YOUR-CLUSTER, YOUR_PASSWORD or "<db_password>"). Copy the real connection string from Atlas (Connect → Drivers) and replace the password and the database name.',
    };
  }

  const parts = authority.split("@");

  if (parts.length > 2) {
    return {
      ok: false,
      reason:
        'The username or password seems to contain "@". Special characters must be URL-encoded (@ becomes %40), or use a password with letters and numbers only.',
    };
  }

  const host = parts[parts.length - 1];
  if (!host) return { ok: false, reason: "The host is missing." };

  if (!database) {
    return {
      ok: false,
      reason:
        'There is no database name. Add it after the host and before the "?", for example ".../tripsathi?retryWrites=true". Without it MongoDB would use a database called "test".',
    };
  }

  return { ok: true, host, database, hasCredentials: parts.length === 2 };
}

/** Hides credentials in any text that might contain a connection string. */
export function scrubMongoCredentials(text) {
  return String(text ?? "").replace(
    /(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi,
    "$1[credentials hidden]@"
  );
}