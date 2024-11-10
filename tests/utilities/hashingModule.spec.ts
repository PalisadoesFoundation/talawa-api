import { describe, it, expect } from "vitest";
import { compareHashedEmails, hashEmail } from "../../src/utilities/hashEmail";
import { setHashPepper } from "../../setup";

describe("hashingModule", () => {
  describe("hashingEmail", () => {
    const testCases = [
      "test@example.com",
      "USER@EXAMPLE.COM",
      "special.chars+test@domain.com",
    ];

    const HASH_FORMAT_REGEX = /^[a-f0-9]{64}$/i;

    testCases.forEach((email) => {
      it(`should correctly hash email: ${email}`, () => {
        const hashedFirstEmail = hashEmail(email);
        const hashedSecondEmail = hashEmail(email);

        expect(hashedFirstEmail).toEqual(hashedSecondEmail);

        expect(email.toLowerCase()).not.toEqual(hashedFirstEmail);

        expect(hashedFirstEmail).toMatch(HASH_FORMAT_REGEX);
      });
    });

    it("should handle null/undefined gracefully", () => {
      expect(() => hashEmail(null as unknown as string)).toThrow();
      expect(() => hashEmail(undefined as unknown as string)).toThrow();
    });

    it("should produce different hashes with different HASH_PEPPER values", async () => {
      const email = "test@example.com";
      const originalPepper = process.env.HASH_PEPPER;
      if (!originalPepper) {
        throw new Error("HASH_PEPPER environment variable is required");
      }
      try {
        const pepper1 = await setHashPepper();
        const pepper2 = await setHashPepper();
        if (pepper1 != undefined && pepper2 != undefined) {
          process.env.HASH_PEPPER = pepper1;
          const hash1 = hashEmail(email);
          process.env.HASH_PEPPER = "pepper2";
          const hash2 = hashEmail(email);
          expect(hash1).not.toEqual(hash2);
        }
      } finally {
        process.env.HASH_PEPPER = originalPepper;
      }
    });
    it("should throw an error for an invalid email format", () => {
      const invalidEmails = [
        "plainaddress",
        "missing@domain",
        "@missinglocal.com",
        "missing@.com",
      ];

      invalidEmails.forEach((email) => {
        expect(() => hashEmail(email)).toThrow("Invalid email format");
      });
    });

    it("should throw an error if HASH_PEPPER is missing", () => {
      const originalPepper = process.env.HASH_PEPPER;
      delete process.env.HASH_PEPPER;

      expect(() => hashEmail("test@example.com")).toThrow(
        "Missing HASH_PEPPER environment variable required for secure email hashing",
      );

      process.env.HASH_PEPPER = originalPepper;
    });

    it("should throw an error if HASH_PEPPER is shorter than 32 characters", () => {
      const originalPepper = process.env.HASH_PEPPER;
      process.env.HASH_PEPPER = "short_pepper";

      expect(() => hashEmail("test@example.com")).toThrow(
        "HASH_PEPPER must be at least 32 characters long",
      );

      process.env.HASH_PEPPER = originalPepper;
    });
  });

  describe("compareHashedEmails function error handling", () => {
    it("should return false for invalid hashed email formats", () => {
      const validHash = "a".repeat(64);
      const invalidHashes = [
        "short",
        "invalid_characters_!@#",
        "",
        null,
        undefined,
      ];

      invalidHashes.forEach((invalidHash) => {
        expect(
          compareHashedEmails(invalidHash as unknown as string, validHash),
        ).toBe(false);
        expect(
          compareHashedEmails(validHash, invalidHash as unknown as string),
        ).toBe(false);
      });
    });

    it("should log an error and return false if crypto.timingSafeEqual fails due to invalid hex encoding", () => {
      const invalidHash = "z".repeat(64); // deliberately invalid hex
      let result;
      try {
        result = compareHashedEmails(invalidHash, invalidHash);
      } catch (error) {
        expect(result).toBe(false);
        if (error instanceof Error) {
          expect(error.message).toBe(
            "Failed to compare hashes, likely due to invalid hex encoding",
          );
        }
      }
    });
  });
});
