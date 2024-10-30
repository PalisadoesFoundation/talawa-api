import crypto from "crypto";

/**
 * Securely hashes email addresses using HMAC-SHA256.
 *
 * **Security Notice:**
 * - Requires `HASH_PEPPER` environment variable.
 * - Intended for storing hashed emails in the database.
 * - Not suitable for password hashing.
 *
 * @param email - The email address to hash.
 * @returns The hashed email in hexadecimal format.
 * @throws error If the email format is invalid or `HASH_PEPPER` is missing or improperly configured.
 */

export function hashEmail(email: string): string {
  if (!email || typeof email !== "string") {
    throw new Error("Email parameter must be a non-empty string");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  if (!process.env.HASH_PEPPER) {
    throw new Error(
      "Missing HASH_PEPPER environment variable required for secure email hashing",
    );
  }

  if (process.env.HASH_PEPPER.length < 32) {
    throw new Error("HASH_PEPPER must be at least 32 characters long");
  }

  const hashedEmail = crypto
    .createHmac("sha256", process.env.HASH_PEPPER)
    .update(email.toLowerCase().trim())
    .digest("hex");

  return hashedEmail;
}

/**
 * Compares two hashed email strings securely.
 *
 * This function checks if two hashed email addresses match in a timing-safe manner.
 * It is designed to prevent timing attacks by comparing the hashes without revealing
 * the time difference based on mismatched characters.
 *
 * @param a - The first hashed email string to compare.
 * @param b - The second hashed email string to compare.
 * @returns `true` if the hashed emails are identical, otherwise `false`.
 * @throws error If either of the hashes is not a valid 64-character hexadecimal string.
 */

export function compareHashedEmails(a: string, b: string): boolean {
  if (!a || !b || typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  if (!/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    console.error(
      "Failed to compare hashes, likely due to invalid hex encoding",
    );
    return false;
  }
}
