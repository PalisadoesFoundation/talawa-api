import crypto from "crypto";

const algorithm = "aes-256-gcm";

const authTagLength = 16;
const authTagHexLength = authTagLength * 2;

const saltLength = 16;

export function generateRandomIV(): string {
  return crypto.randomBytes(saltLength).toString("hex");
}

export function encryptEmail(email: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  } else if (encryptionKey.length !== 64) {
    throw new Error(
      "Encryption key must be a 256-bit hexadecimal string (64 characters).",
    );
  }

  const iv = generateRandomIV();
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

export function decryptEmail(encryptedData: string): {
  decrypted: string;
} {
  const minLength = saltLength * 2 + authTagHexLength + 2; 
 const maxLength = saltLength * 2 + authTagHexLength + 1000; 
    if (encryptedData.length < minLength) {
       throw new Error("Invalid encrypted data: input is too short.");
   } else if (encryptedData.length > maxLength) {
      throw new Error("Invalid encrypted data: input is too long.");
     }

  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("Encryption key is not defined.");
  } else if (encryptionKey.length !== 64) {
    throw new Error(
      "Encryption key must be a 256-bit hexadecimal string (64 characters).",
    );
  }

  const iv = encryptedData.slice(0, saltLength * 2);
  const authTag = Buffer.from(
    encryptedData.slice(saltLength * 2, saltLength * 2 + authTagHexLength),
    "hex",
  );
  const encrypted = encryptedData.slice(saltLength * 2 + authTagHexLength);

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(authTag);

  let decrypted;
  try {
    decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    throw new Error("Decryption failed: invalid data or authentication tag.");
  }
  return {decrypted};
}
