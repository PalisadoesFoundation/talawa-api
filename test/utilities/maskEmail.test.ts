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

	it("should mask unicode/internationalized email addresses", () => {
		expect(maskEmail("用户@example.com")).toBe("用***@example.com");
		expect(maskEmail("münchen@test.de")).toBe("m***@test.de");
	});

	it("should handle quoted local parts (uses first @ found)", () => {
		// Current implementation uses indexOf("@") which finds first @
		expect(maskEmail('"user@local"@example.com')).toBe(
			'"***@local"@example.com',
		);
	});

	it("should mask emails with nested subdomains", () => {
		expect(maskEmail("a@sub.domain.example.com")).toBe(
			"a***@sub.domain.example.com",
		);
		expect(maskEmail("user@mail.corp.company.org")).toBe(
			"u***@mail.corp.company.org",
		);
	});
});
