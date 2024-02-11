import crypto from "crypto";

// Decryption function
export function decrypt(
  encryptedText: string,
  key: string,
  iv: string
): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
