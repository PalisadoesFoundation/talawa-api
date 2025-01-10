import crypto from "crypto";

/**
 * Decrypts the given encrypted text using AES-256-CBC decryption.
 *
 * @param encryptedText - The encrypted text to decrypt, encoded as a hexadecimal string.
 * @param key - The encryption key used for decryption.
 * @param iv - The initialization vector (IV), used to ensure different ciphertexts encrypt to different ciphertexts even if the plaintexts are identical.
 * @returns The decrypted plaintext string.
 */
export function decrypt(
  encryptedText: string,
  key: string,
  iv: string,
): string {
  // Create a decipher object with AES-256-CBC algorithm, using the provided key and IV
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key), // Convert key from string to buffer
    Buffer.from(iv, "hex"), // Convert IV from hexadecimal string to buffer
  );

  // Decrypt the encrypted text
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  // Return the decrypted plaintext
  return decrypted;
}
