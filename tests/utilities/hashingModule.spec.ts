import { describe, it, expect } from "vitest";
import { hashEmail } from "../../src/utilities/hashEmail";

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

    it("should produce different hashes with different HASH_PEPPER values", () => {
      const email = "test@example.com";
      const originalPepper = process.env.HASH_PEPPER;
      if (!originalPepper) {
        throw new Error("HASH_PEPPER environment variable is required");
      }
      try {
        process.env.HASH_PEPPER = "pepper1";
        const hash1 = hashEmail(email);
        process.env.HASH_PEPPER = "pepper2";
        const hash2 = hashEmail(email);
        expect(hash1).not.toEqual(hash2);
      } finally {
        process.env.HASH_PEPPER = originalPepper;
      }
    });
  });
});
