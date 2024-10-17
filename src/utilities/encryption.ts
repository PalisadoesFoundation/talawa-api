import crypto from "crypto";
import { setEncryptionKey } from "../../setup";

const algorithm = "aes-256-ctr";

const saltlength = 16;
if (!process.env.ENCRYPTION_KEY) {
  setEncryptionKey();
}

export function generateRandomSalt(): string {
  return crypto.randomBytes(saltlength).toString("hex");
}

export function encryptEmail(email: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  }

  const salt = generateRandomSalt();
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(salt, "hex"),
  );

  let encrypted = cipher.update(email, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return salt + encrypted;
}

export function decryptEmail(encryptedWithEmailSalt: string): {
  decrypted: string;
  salt: string;
} {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  }

  const salt = encryptedWithEmailSalt.slice(0, saltlength * 2);

  const encrypted = encryptedWithEmailSalt.slice(saltlength * 2);

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(salt, "hex"),
  );

  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return { decrypted, salt };
}