import crypto from "crypto";
// import { setEncryptionKey } from "../../setup";

const algorithm = "aes-256-ctr";
const saltLength = 16;

/**
 * This file only be used to setup the encryption key while
 * using the test-suite in github actions.
 */

// setEncryptionKey();

/**
 * Generates a random salt of the specified length.
 * @returns A randomly generated hexadecimal string representing the salt.
 */
export function generateRandomSalt(): string {
  return crypto.randomBytes(saltLength).toString("hex");
}

/**
 * Encrypts an email address using AES-256-CTR encryption with a randomly generated salt.
 * The salt is prepended to the final encrypted email for secure storage.
 * @param email - The email address to be encrypted.
 * @returns The encrypted email with the prepended salt.
 * @throws Throws an error if the encryption key is not defined.
 */
export function encryptEmail(email: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  }
  const salt = generateRandomSalt();
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(salt, "hex")
  );
  let encrypted = cipher.update(email, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return salt + encrypted;
}

/**
 * Decrypts an email address that was encrypted using AES-256-CTR with a prepended salt.
 * Extracts the salt and uses it along with the encryption key for decryption.
 * @param encryptedWithEmailSalt - The encrypted email with the prepended salt.
 * @returns The decrypted email address.
 * @throws Throws an error if the encryption key is not defined.
 */
export function decryptEmail(encryptedWithEmailSalt: string): {
  decrypted: string;
  salt: string;
} {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  }

  // Extracting the salt from the beginning of the encryptedWithEmailSalt.
  const salt = encryptedWithEmailSalt.slice(0, saltLength * 2);

  // Extracting the encrypted email (excluding the salt)
  const encrypted = encryptedWithEmailSalt.slice(saltLength * 2);

  // Using the encryption key, salt, and encrypted email to create the decipher
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(salt, "hex")
  );

  // Decrypting the email
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return { decrypted, salt };
}
