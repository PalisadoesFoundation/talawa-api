import { describe, it, expect } from "vitest";
import {
  decryptEmail,
  encryptEmail,
  generateRandomIV,
} from "../../src/utilities/encryption";

describe("encryptionModule", () => {
  describe("generateRandomIV", () => {
    it("should generate a random salt of the specified length", () => {
      const salt = generateRandomIV();
      expect(salt.length).toEqual(2 * 16);
    });

    it("should generate unique IVs for each call", () => {
      const iv1 = generateRandomIV();
      const iv2 = generateRandomIV();
      expect(iv1).not.toEqual(iv2);
   });
   
   it("should generate IV with valid hex characters", () => {
      const iv = generateRandomIV();
      expect(iv).toMatch(/^[0-9a-f]+$/i);
  });
});

  describe("encryptEmail and decryptEmail", () => {
    it("should encrypt and decrypt an email correctly", () => {
      const email = "test@example.com";
      const encryptedWithEmailSalt = encryptEmail(email);
      const { decrypted }: { decrypted: string } = decryptEmail(encryptedWithEmailSalt);
      expect(encryptedWithEmailSalt).not.toEqual(email);
      expect(decrypted).toEqual(email);
    });

    it("throws an error for empty email input", () => {
      expect(() => encryptEmail("")).toThrow("Empty or invalid email input.");
    });

    it("throws an error for an invalid encryption key", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = "invalid_key";
      expect(() => encryptEmail("test@example.com")).toThrow(
        "Encryption key must be a 256-bit hexadecimal string (64 characters)."
      );
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it("should handle email addresses with special characters", () => {
      const email = "test+label@example.com";
      const encrypted = encryptEmail(email);
      const { decrypted } = decryptEmail(encrypted);
      expect(decrypted).toEqual(email);
    });

    it("handles very long email input gracefully", () => {
      const longEmail = "a".repeat(10000) + "@example.com";
      expect(() => encryptEmail(longEmail)).not.toThrow();
      const encrypted = encryptEmail(longEmail);
      const decrypted = decryptEmail(encrypted).decrypted;
      expect(decrypted).toBe(longEmail);
    });

    it("should use a unique IV for each encryption", () => {
      const email = "test@example.com";
      const encrypted1 = encryptEmail(email);
      const encrypted2 = encryptEmail(email);
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it("should maintain consistent encryption format", () => {
      const email = "test@example.com";
      const encrypted = encryptEmail(email);
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i);
    });
  });
});