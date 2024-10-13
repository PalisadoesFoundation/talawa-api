import { describe, it, expect } from "vitest";
import {
  decryptEmail,
  encryptEmail,
  generateRandomSalt,
} from "../../src/utilities/encryption";

describe("encryptionModule", () => {
  describe("generateRandomSalt", () => {
    it("should generate a random salt of the specified length", () => {
      const salt = generateRandomSalt();
      expect(salt.length).toEqual(2 * 16);
    });
  });

  describe("encryptEmail and decryptEmail", () => {
    it("should encrypt and decrypt an email correctly", () => {
      const email = "test@example.com";

      const encryptedWithEmailSalt = encryptEmail(email);

      const { decrypted, salt } = decryptEmail(encryptedWithEmailSalt);

      expect(decrypted).toEqual(email);
      expect(salt.length).toEqual(2 * 16);
    });
  });
});