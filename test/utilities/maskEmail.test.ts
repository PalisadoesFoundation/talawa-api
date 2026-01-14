import { describe, expect, it } from "vitest";
import { maskEmail } from "~/src/utilities/maskEmail";

describe("maskEmail", () => {
    it("should mask standard email addresses", () => {
        expect(maskEmail("john.doe@example.com")).toBe("j***@example.com");
        expect(maskEmail("alice@test.org")).toBe("a***@test.org");
    });

    it("should mask short local parts", () => {
        expect(maskEmail("a@b.com")).toBe("a***@b.com");
        expect(maskEmail("ab@c.com")).toBe("a***@c.com");
    });

    it("should handle empty local part or invalid format", () => {
        expect(maskEmail("@example.com")).toBe("***");
        expect(maskEmail("invalid-email")).toBe("***");
        expect(maskEmail("")).toBe("***");
    });
});
