import { describe, it, expect, afterEach } from "vitest";
import {
  decryptEmail,
  encryptEmail,
  generateRandomIV,
} from "../../src/utilities/encryption";

describe("encryptionModule", () => {
  const validEncryptedData =
    "11898325fe8807edeb99d37f0b168eaa:3991cd4d1a6372ed70492e23d499b066:4f209bb501460537fa9345ca16361023a19f9b2eff1860e8dadc80f29705d469cbe46edc4913e77d3418814b8eb7";
  const originalKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });
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

    it("should handle malformed encrypted data gracefully", () => {
      expect(() => decryptEmail("invalid:format")).toThrow();
      expect(() => decryptEmail("invalid:format:data")).toThrow();
      expect(() => decryptEmail("::::")).toThrow();
    });
  });

  describe("encryptEmail and decryptEmail", () => {
    it("should encrypt and decrypt an email correctly", () => {
      const email = "test@example.com";
      const encryptedWithEmailSalt = encryptEmail(email);
      const { decrypted }: { decrypted: string } = decryptEmail(
        encryptedWithEmailSalt,
      );
      expect(encryptedWithEmailSalt).not.toEqual(email);
      expect(decrypted).toEqual(email);
    });

    it("throws an error for invalid email format", () => {
      expect(() => encryptEmail("a".repeat(10000))).toThrow(
        "Invalid email format",
      );
    });

    it("throws an error for empty email input", () => {
      expect(() => encryptEmail("")).toThrow("Empty or invalid email input.");
    });

    it("throws an error for an invalid encryption key", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = "invalid_key";
      expect(() => encryptEmail("test@example.com")).toThrow(
        "Encryption key must be a valid 256-bit hexadecimal string (64 characters).",
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

  it("should throw an error if encrypted data format is invalid (missing iv, authTag, or encryptedHex)", () => {
    expect(() => decryptEmail("a".repeat(10000))).toThrow(
      "Invalid encrypted data format. Expected format 'iv:authTag:encryptedData'.",
    );
  });

  it("should throw an error if encryption key length is not 64 characters", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(32); // 32 characters instead of 64
    expect(() => decryptEmail(validEncryptedData)).toThrow(
      "Encryption key must be a valid 256-bit hexadecimal string (64 characters).",
    );
  });

  it("should throw an error if encryption key contains non-hexadecimal characters", () => {
    process.env.ENCRYPTION_KEY = "z".repeat(64); // 'z' is not a valid hex character
    expect(() => decryptEmail(validEncryptedData)).toThrow(
      "Encryption key must be a valid 256-bit hexadecimal string (64 characters).",
    );
  });

  it("should not throw an error for a valid 64-character hexadecimal encryption key", () => {
    expect(() => decryptEmail(validEncryptedData)).not.toThrow();
  });

  it("should throw an error for a invalid encrypted data", () => {
    const invalidEncryptedData =
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:1234567890abcdef1234567890abcdef:abcd1234abcd1234";
    expect(() => decryptEmail(invalidEncryptedData)).toThrow(
      "Decryption failed: invalid data or authentication tag.",
    );
  });
});
