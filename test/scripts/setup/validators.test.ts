import type { SetupAnswers } from "scripts/setup/types";
import {
	isBooleanString,
	validateAllAnswers,
	validateBooleanFields,
	validateHmacSecretLength,
	validateJwtSecretLength,
	validatePortNumbers,
	validateRequiredFields,
	validateSamplingRatio,
	validateTokenExpiration,
} from "scripts/setup/validators";
import { describe, expect, it, vi } from "vitest";

describe("Setup -> Validators", () => {
	describe("validateJwtSecretLength", () => {
		it("should return true for valid secrets", () => {
			const valid = "a".repeat(128);
			expect(validateJwtSecretLength(valid)).toBe(true);
		});

		it("should return error for short secrets", () => {
			const shorter = "a".repeat(127);
			expect(validateJwtSecretLength(shorter)).toBe(
				"JWT secret must be at least 128 characters long.",
			);
		});

		it("should trim input before validation", () => {
			const padded = ` ${"a".repeat(128)} `;
			expect(validateJwtSecretLength(padded)).toBe(true);
			const shortPadded = ` ${"a".repeat(127)} `;
			expect(validateJwtSecretLength(shortPadded)).toBe(
				"JWT secret must be at least 128 characters long.",
			);
		});
	});

	describe("validateTokenExpiration", () => {
		it("should return true for valid numeric strings >= 60", () => {
			expect(validateTokenExpiration("60")).toBe(true);
			expect(validateTokenExpiration("3600")).toBe(true);
		});

		it("should return error for non-numeric input", () => {
			expect(validateTokenExpiration("60s")).toBe(
				"Expiration must be a valid number of seconds.",
			);
			expect(validateTokenExpiration("abc")).toBe(
				"Expiration must be a valid number of seconds.",
			);
		});

		it("should return error for numbers < 60", () => {
			expect(validateTokenExpiration("59")).toBe(
				"Expiration must be at least 60 seconds.",
			);
			expect(validateTokenExpiration("0")).toBe(
				"Expiration must be at least 60 seconds.",
			);
		});
	});

	describe("validateHmacSecretLength", () => {
		it("should return true for valid secrets (>= 32 chars)", () => {
			const valid = "a".repeat(32);
			expect(validateHmacSecretLength(valid)).toBe(true);
		});

		it("should return error for short secrets", () => {
			const shorter = "a".repeat(31);
			expect(validateHmacSecretLength(shorter)).toBe(
				"HMAC secret must be at least 32 characters long.",
			);
		});

		it("should trim input", () => {
			const padded = ` ${"a".repeat(32)} `;
			expect(validateHmacSecretLength(padded)).toBe(true);
			const shortPadded = ` ${"a".repeat(31)} `;
			expect(validateHmacSecretLength(shortPadded)).toBe(
				"HMAC secret must be at least 32 characters long.",
			);
		});
	});

	describe("isBooleanString", () => {
		it("should return true for 'true' or 'false'", () => {
			expect(isBooleanString("true")).toBe(true);
			expect(isBooleanString("false")).toBe(true);
		});

		it("should return false for other strings", () => {
			expect(isBooleanString("yes")).toBe(false);
			expect(isBooleanString("no")).toBe(false);
			expect(isBooleanString("1")).toBe(false);
			expect(isBooleanString("")).toBe(false);
		});

		it("should return false for non-string values", () => {
			expect(isBooleanString(true)).toBe(false);
			expect(isBooleanString(1)).toBe(false);
			expect(isBooleanString(null)).toBe(false);
			expect(isBooleanString(undefined)).toBe(false);
		});
	});

	describe("validateRequiredFields", () => {
		it("should not throw when required fields are present", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
			};
			expect(() => validateRequiredFields(answers)).not.toThrow();
		});

		it("should throw error when required fields are missing", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
			};
			expect(() => validateRequiredFields(answers)).toThrow(
				"Missing required configuration fields: API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			);
		});

		it("should throw error when fields are empty strings", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "",
			};
			expect(() => validateRequiredFields(answers)).toThrow(
				"Missing required configuration fields: CI, API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			);
		});
	});

	describe("validateBooleanFields", () => {
		it("should valid valid boolean strings", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
				useDefaultApi: "false",
			};
			expect(() => validateBooleanFields(answers)).not.toThrow();
		});

		it("should allow undefined optional boolean fields", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
			};
			expect(() => validateBooleanFields(answers)).not.toThrow();
		});

		it("should throw for invalid boolean strings", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "yes",
				API_IS_GRAPHIQL: "1",
			};
			expect(() => validateBooleanFields(answers)).toThrow(
				'Boolean fields must be "true" or "false": CI, API_IS_GRAPHIQL',
			);
		});
	});

	describe("validatePortNumbers", () => {
		it("should pass for valid ports", () => {
			const answers: Partial<SetupAnswers> = {
				API_PORT: "4000",
				API_MINIO_PORT: "9000",
			};
			expect(() => validatePortNumbers(answers)).not.toThrow();
		});

		it("should allow undefined optional ports", () => {
			const answers: Partial<SetupAnswers> = {};
			expect(() => validatePortNumbers(answers)).not.toThrow();
		});

		it("should throw for invalid ports", () => {
			const answers: Partial<SetupAnswers> = {
				API_PORT: "0",
				API_MINIO_PORT: "70000",
				POSTGRES_MAPPED_PORT: "abc",
			};
			expect(() => validatePortNumbers(answers)).toThrow(
				/Port numbers must be between 1 and 65535:/,
			);
			// Check that specific fields are mentioned (order might vary)
			try {
				validatePortNumbers(answers);
			} catch (error: unknown) {
				const e = error as Error;
				expect(e.message).toContain("API_PORT");
				expect(e.message).toContain("API_MINIO_PORT");
				expect(e.message).toContain("POSTGRES_MAPPED_PORT");
			}
		});
	});

	describe("validateSamplingRatio", () => {
		it("should return true for valid ratios (0-1)", () => {
			expect(validateSamplingRatio("0")).toBe(true);
			expect(validateSamplingRatio("0.5")).toBe(true);
			expect(validateSamplingRatio("1.0")).toBe(true);
		});

		it("should return error for invalid ratios", () => {
			expect(validateSamplingRatio("-0.1")).toBe(
				"Please enter valid sampling ratio (0-1).",
			);
			expect(validateSamplingRatio("1.1")).toBe(
				"Please enter valid sampling ratio (0-1).",
			);
			expect(validateSamplingRatio("abc")).toBe(
				"Please enter valid sampling ratio (0-1).",
			);
		});
	});

	describe("validateAllAnswers", () => {
		it("should pass for valid configuration", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
				API_PORT: "4000",
			};
			// Mock console.log to avoid noise
			const spy = vi.spyOn(console, "log").mockImplementation(() => {});
			expect(() => validateAllAnswers(answers)).not.toThrow();
			spy.mockRestore();
		});

		it("should throw if required fields are missing", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
				// Missing API_ADMINISTRATOR_USER_EMAIL_ADDRESS
			};
			expect(() => validateAllAnswers(answers)).toThrow(
				"Missing required configuration fields:",
			);
		});

		it("should throw if boolean fields are invalid", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "invalid", // Invalid boolean
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
			};
			expect(() => validateAllAnswers(answers)).toThrow(
				'Boolean fields must be "true" or "false":',
			);
		});

		it("should throw if port numbers are invalid", () => {
			const answers: Partial<SetupAnswers> = {
				CI: "true",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
				API_PORT: "99999", // Invalid port
			};
			expect(() => validateAllAnswers(answers)).toThrow(
				"Port numbers must be between 1 and 65535:",
			);
		});
	});
});
