import { validatePort, validateSecurePassword } from "scripts/setup/validators";
import { describe, expect, it } from "vitest";

describe("Setup Edge Cases", () => {
	it("should validate boundary ports", () => {
		expect(validatePort("1")).toBe(true);
		expect(validatePort("65535")).toBe(true);
		expect(validatePort("0")).not.toBe(true);
		expect(validatePort("65536")).not.toBe(true);
	});

	it("should validate complex passwords", () => {
		expect(validateSecurePassword("Complex!@#123")).toBe(true);
		expect(validateSecurePassword(" ")).not.toBe(true);
		expect(validateSecurePassword("short1!")).not.toBe(true);
		// Special chars check
		expect(validateSecurePassword("Pass123$")).toBe(true);
		expect(validateSecurePassword("Pass123%")).toBe(true);
		expect(validateSecurePassword("Pass123^")).toBe(true);
		expect(validateSecurePassword("Pass123&")).toBe(true);
		expect(validateSecurePassword("Pass123*")).toBe(true);
	});
});
