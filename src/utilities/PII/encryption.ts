import crypto from "crypto";

// Encryption function
export function encrypt(text: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    Buffer.from(iv, "hex")
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}
