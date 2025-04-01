import { expect, suite, test } from "vitest";
import { sanitizeEmail, sanitizeText } from "~/src/utilities/sanitization";

suite("Sanitization utilities", () => {
	suite("sanitizeText", () => {
		test("sanitizes valid text correctly", () => {
			expect(sanitizeText("ValidText123@")).toBe("ValidText123@");
			expect(sanitizeText(" abc# ")).toBe("abc#");
		});

		test("throws on whitespace characters", () => {
			expect(() => sanitizeText("abc def")).toThrow(
				"Text must not contain spaces",
			);
			expect(() => sanitizeText("abc\tdef")).toThrow();
		});

		test("throws on command injection and special characters", () => {
			const badInputs = [
				"ls; pwd;",
				"()",
				"[]",
				"<script>",
				"<img src=x onerror=alert(1)>",
				"&",
				"&&",
				"|",
				"`rm -rf /`",
				"$HOME",
				"hello!",
			];

			for (const input of badInputs) {
				expect(() => sanitizeText(input)).toThrow();
			}
		});
	});

	suite("sanitizeEmail", () => {
		test("sanitizes and normalizes valid emails", () => {
			expect(sanitizeEmail("  USER@Example.com ")).toBe("user@example.com");
		});

		test("throws on invalid emails", () => {
			const invalidEmails = [
				"plainaddress",
				"user@@domain.com",
				"user@.com",
				"user@domain..com",
				"user@domain,com",
				"<script>alert(1)</script>",
				"user\u0001@domain.com",
			];

			for (const email of invalidEmails) {
				expect(() => sanitizeEmail(email)).toThrow();
			}
		});
	});
});
