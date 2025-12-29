import { describe, expect, it } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

describe("TalawaRestError", () => {
	it("should create error with required fields", () => {
		const error = new TalawaRestError({
			code: ErrorCode.NOT_FOUND,
			message: "Resource not found",
		});

		expect(error.name).toBe("TalawaRestError");
		expect(error.code).toBe(ErrorCode.NOT_FOUND);
		expect(error.message).toBe("Resource not found");
		expect(error.statusCode).toBe(404);
		expect(error.details).toBeUndefined();
	});

	it("should create error with details", () => {
		const details = { resourceId: "123", resourceType: "user" };
		const error = new TalawaRestError({
			code: ErrorCode.NOT_FOUND,
			message: "User not found",
			details,
		});

		expect(error.details).toEqual(details);
	});

	it("should use status code override when provided", () => {
		const error = new TalawaRestError({
			code: ErrorCode.NOT_FOUND,
			message: "Custom error",
			statusCodeOverride: 418,
		});

		expect(error.statusCode).toBe(418);
	});

	it("should fall back to 500 for unmapped error codes", () => {
		// Create error with a code that might not be in the mapping
		const error = new TalawaRestError({
			code: "unknown_code" as ErrorCode,
			message: "Unknown error",
		});

		expect(error.statusCode).toBe(500);
	});

	it("should extend Error class properly", () => {
		const error = new TalawaRestError({
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Invalid input",
		});

		expect(error instanceof Error).toBe(true);
		expect(error instanceof TalawaRestError).toBe(true);
		expect(error.stack).toBeDefined();
	});

	describe("toJSON method", () => {
		it("should return standard error payload without correlationId", () => {
			const error = new TalawaRestError({
				code: ErrorCode.UNAUTHORIZED,
				message: "Access denied",
				details: { permission: "admin" },
			});

			const json = error.toJSON();

			expect(json).toEqual({
				error: {
					code: ErrorCode.UNAUTHORIZED,
					message: "Access denied",
					details: { permission: "admin" },
					correlationId: undefined,
				},
			});
		});

		it("should return standard error payload with correlationId", () => {
			const error = new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Server error",
			});

			const correlationId = "req-12345";
			const json = error.toJSON(correlationId);

			expect(json).toEqual({
				error: {
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Server error",
					details: undefined,
					correlationId,
				},
			});
		});

		it("should handle empty details", () => {
			const error = new TalawaRestError({
				code: ErrorCode.RATE_LIMIT_EXCEEDED,
				message: "Too many requests",
			});

			const json = error.toJSON("req-456");

			expect(json.error.details).toBeUndefined();
			expect(json.error.correlationId).toBe("req-456");
		});
	});

	describe("HTTP status code mapping", () => {
		const testCases = [
			{ code: ErrorCode.UNAUTHENTICATED, expectedStatus: 401 },
			{ code: ErrorCode.UNAUTHORIZED, expectedStatus: 403 },
			{ code: ErrorCode.INVALID_ARGUMENTS, expectedStatus: 400 },
			{ code: ErrorCode.NOT_FOUND, expectedStatus: 404 },
			{ code: ErrorCode.CONFLICT, expectedStatus: 409 },
			{ code: ErrorCode.RATE_LIMIT_EXCEEDED, expectedStatus: 429 },
			{ code: ErrorCode.INTERNAL_SERVER_ERROR, expectedStatus: 500 },
			{ code: ErrorCode.EXTERNAL_SERVICE_ERROR, expectedStatus: 502 },
		];

		testCases.forEach(({ code, expectedStatus }) => {
			it(`should map ${code} to status ${expectedStatus}`, () => {
				const error = new TalawaRestError({
					code,
					message: "Test error",
				});

				expect(error.statusCode).toBe(expectedStatus);
			});
		});
	});
});
