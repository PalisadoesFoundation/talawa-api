import { describe, expect, it } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

describe("TalawaRestError", () => {
	describe("constructor", () => {
		it("should create an error with default statusCode of 500 when statusCodeOverride is not provided", () => {
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Internal server error",
			});

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(TalawaRestError);
			expect(error.name).toBe("TalawaRestError");
			expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(error.message).toBe("Internal server error");
			expect(error.statusCode).toBe(500);
			expect(error.details).toBeUndefined();
		});

		it("should create an error with custom statusCode when statusCodeOverride is provided", () => {
			const error = new TalawaRestError({
				code: ErrorCode.RATE_LIMIT_EXCEEDED,
				message: "Too many requests",
				statusCodeOverride: 429,
			});

			expect(error.statusCode).toBe(429);
			expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
			expect(error.message).toBe("Too many requests");
		});

		it("should correctly assign details property when provided", () => {
			const details = { resetAt: 1234567890, userId: "user123" };
			const error = new TalawaRestError({
				code: ErrorCode.RATE_LIMIT_EXCEEDED,
				message: "Too many requests",
				details,
				statusCodeOverride: 429,
			});

			expect(error.details).toEqual(details);
			expect(error.details).toBe(details);
		});

		it("should handle empty details object", () => {
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Error",
				details: {},
			});

			expect(error.details).toEqual({});
		});

		it("should set error name to TalawaRestError", () => {
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Test error",
			});

			expect(error.name).toBe("TalawaRestError");
		});

		it("should inherit from Error class correctly", () => {
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Test error",
			});

			expect(error).toBeInstanceOf(Error);
			expect(error.stack).toBeDefined();
		});

		it("should preserve message property", () => {
			const message = "Custom error message with special characters: !@#$%";
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message,
			});

			expect(error.message).toBe(message);
		});

		it("should handle different error codes", () => {
			const codes = [
				ErrorCode.INTERNAL_SERVER_ERROR,
				ErrorCode.RATE_LIMIT_EXCEEDED,
			];

			for (const code of codes) {
				const error = new TalawaRestError({
					code,
					message: "Test",
				});
				expect(error.code).toBe(code);
			}
		});

		it("should allow statusCodeOverride of 0", () => {
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Test",
				statusCodeOverride: 0,
			});

			expect(error.statusCode).toBe(0);
		});

		it("should handle complex nested details", () => {
			const complexDetails = {
				user: {
					id: "123",
					name: "John",
				},
				metadata: {
					timestamp: Date.now(),
					context: ["api", "rate-limit"],
				},
			};

			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Test",
				details: complexDetails,
			});

			expect(error.details).toEqual(complexDetails);
		});
	});
});
