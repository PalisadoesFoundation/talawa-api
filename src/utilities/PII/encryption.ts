import crypto from "crypto";

/**
 * Encrypts plaintext using AES-256-CBC encryption.
 * @param text - The plaintext to encrypt.
 * @param key - The encryption key as a string.
 * @param iv - The initialization vector (IV) as a string in hexadecimal format.
 * @returns The encrypted ciphertext as a hexadecimal string.
 */
export function encrypt(text: string, key: string, iv: string): string {
  // Create a cipher object using AES-256-CBC algorithm with provided key and IV
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key), // Convert key string to buffer
    Buffer.from(iv, "hex"), // Convert IV string from hexadecimal to buffer
  );

  // Encrypt the plaintext
  let encrypted = cipher.update(text); // Perform encryption
  encrypted = Buffer.concat([encrypted, cipher.final()]); // Finalize encryption and concatenate

  // Return encrypted ciphertext as hexadecimal string
  return encrypted.toString("hex");
}
