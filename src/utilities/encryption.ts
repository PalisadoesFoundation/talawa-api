import crypto from "crypto";

const algorithm = "aes-256-gcm";

const saltlength = 16;

export function generateRandomSalt(): string {
  return crypto.randomBytes(saltlength).toString("hex");
}

export function encryptEmail(email: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  }

  const iv = generateRandomSalt();
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(iv, "hex"),
  );

  const encrypted = Buffer.concat([
    cipher.update(email, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return iv + authTag.toString("hex") + encrypted.toString("hex");
}

export function decryptEmail(encryptedWithEmailSalt: string): {
  decrypted: string;
  salt: string;
} {
  if (encryptedWithEmailSalt.length < saltlength * 2) {
    throw new Error("Invalid encrypted data: input is too short.");
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  }

  const iv = encryptedWithEmailSalt.slice(0, saltlength * 2);
  const authTag = Buffer.from(
    encryptedWithEmailSalt.slice(saltlength * 2, saltlength * 2 + 32),
    "hex",
  );
  const encrypted = encryptedWithEmailSalt.slice(saltlength * 2 + 32);

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]).toString("utf8");
  return { decrypted, salt: iv };
}
