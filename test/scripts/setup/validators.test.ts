import {
	validateHmacSecretLength,
	validateJwtSecretLength,
	validateTokenExpiration,
} from "scripts/setup/validators";
import { describe, expect, it } from "vitest";

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
});
