import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ZodError, ZodIssueCode } from "zod";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { normalizeError } from "~/src/utilities/errors/errorTransformer";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { rootLogger } from "~/src/utilities/logging/logger";

describe("normalizeError", () => {
	beforeAll(() => {
		vi.stubEnv("NODE_ENV", "test");
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});
	it("should return TalawaRestError as-is", () => {
		const originalError = new TalawaRestError({
			code: ErrorCode.NOT_FOUND,
			message: "Resource not found",
			details: { id: "123" },
		});

		const normalized = normalizeError(originalError);

		expect(normalized).toEqual({
			code: ErrorCode.NOT_FOUND,
			message: "Resource not found",
			statusCode: 404,
			details: { id: "123" },
		});
	});

	it("should normalize Fastify validation errors", () => {
		const fastifyError = {
			code: "FST_ERR_VALIDATION",
			statusCode: 400,
			validation: [
				{
					instancePath: "/body/email",
					schemaPath: "#/properties/body/properties/email/format",
					keyword: "format",
					params: { format: "email" },
					message: 'must match format "email"',
				},
			],
			validationContext: "body",
		};

		const normalized = normalizeError(fastifyError);

		expect(normalized).toEqual({
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Validation failed",
			statusCode: 400,
			details: fastifyError.validation,
		});
	});

	it("should normalize Zod validation errors with flatten method", () => {
		const zodError = new ZodError([
			{
				code: ZodIssueCode.invalid_type,
				expected: "string",
				path: ["name"],
				message: "Expected string, received number",
			},
			{
				code: ZodIssueCode.too_small,
				minimum: 1,
				inclusive: true,
				origin: "string",
				path: ["email"],
				message: "String must contain at least 1 character(s)",
			},
		]);

		const normalized = normalizeError(zodError);

		expect(normalized.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(normalized.message).toBe("Invalid input");
		expect(normalized.statusCode).toBe(400);
		expect(normalized.details).toBeDefined();
	});

	it("should normalize generic Error objects", () => {
		const genericError = new Error("Something went wrong");

		const normalized = normalizeError(genericError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "Something went wrong",
		});
	});

	it("should handle errors without message property", () => {
		const errorWithoutMessage = { someProperty: "value" };

		const normalized = normalizeError(errorWithoutMessage);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "[object Object]",
		});
	});

	it("should handle null/undefined errors", () => {
		const normalizedNull = normalizeError(null);
		const normalizedUndefined = normalizeError(undefined);

		expect(normalizedNull).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "null",
		});

		expect(normalizedUndefined).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "undefined",
		});
	});

	it("should handle string errors", () => {
		const stringError = "Something bad happened";

		const normalized = normalizeError(stringError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "Something bad happened",
		});
	});

	it("should handle objects with message property", () => {
		const errorLikeObject = {
			message: "GraphQL-like error message",
			someOther: "field",
		};

		const normalized = normalizeError(errorLikeObject);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "GraphQL-like error message",
		});
	});

	it("should suppress details in production environment", () => {
		const originalEnv = process.env.NODE_ENV;
		vi.stubEnv("NODE_ENV", "production");

		// Mock rootLogger.error to spy on it
		const loggerErrorSpy = vi.spyOn(rootLogger, "error");

		const sensitiveError = new Error("Sensitive error message");
		const normalized = normalizeError(sensitiveError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: undefined,
		});

		expect(loggerErrorSpy).toHaveBeenCalledWith({
			msg: "Internal Server Error (details suppressed)",
			originalError: {
				message: "Sensitive error message",
				stack: sensitiveError.stack,
				name: "Error",
			},
			details: "Sensitive error message",
		});

		// Restore environment
		if (originalEnv !== undefined) {
			vi.stubEnv("NODE_ENV", originalEnv);
		} else {
			vi.unstubAllEnvs();
		}
		loggerErrorSpy.mockRestore();
	});

	it("should preserve details from TalawaRestError", () => {
		const error = new TalawaRestError({
			code: ErrorCode.UNAUTHORIZED,
			message: "Access denied",
			details: {
				requiredRole: "admin",
				userRole: "user",
				resource: "sensitive-data",
			},
		});

		const normalized = normalizeError(error);

		expect(normalized.details).toEqual({
			requiredRole: "admin",
			userRole: "user",
			resource: "sensitive-data",
		});
	});

	it("should handle complex Fastify error objects", () => {
		const complexFastifyError = {
			code: "FST_ERR_VALIDATION",
			statusCode: 400,
			error: "Bad Request",
			message: "body/age must be >= 18",
			validation: [
				{
					instancePath: "/age",
					schemaPath: "#/properties/age/minimum",
					keyword: "minimum",
					params: { minimum: 18 },
					message: "must be >= 18",
				},
			],
			validationContext: "body",
		};

		const normalized = normalizeError(complexFastifyError);

		expect(normalized.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(normalized.message).toBe("Validation failed");
		expect(normalized.statusCode).toBe(400);
		expect(normalized.details).toEqual(complexFastifyError.validation);
	});

	it("should handle Fastify errors without validation property", () => {
		const fastifyErrorWithoutValidation = {
			code: "FST_ERR_VALIDATION",
			statusCode: 400,
			// No validation property
		};

		const normalized = normalizeError(fastifyErrorWithoutValidation);

		// Should fall through to generic error handling
		expect(normalized.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		expect(normalized.message).toBe("Internal Server Error");
		expect(normalized.statusCode).toBe(500);
		expect(normalized.details).toBe("[object Object]");
	});

	it("should handle Fastify errors without statusCode", () => {
		const fastifyErrorWithoutStatusCode = {
			code: "FST_ERR_VALIDATION",
			validation: [{ message: "test error" }],
			// No statusCode property
		};

		const normalized = normalizeError(fastifyErrorWithoutStatusCode);

		// Should fall through to generic error handling
		expect(normalized.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		expect(normalized.message).toBe("Internal Server Error");
		expect(normalized.statusCode).toBe(500);
		expect(normalized.details).toBe("[object Object]");
	});

	it("should handle Fastify errors with non-FST_ERR code", () => {
		const fastifyErrorWithDifferentCode = {
			code: "SOME_OTHER_ERROR",
			statusCode: 400,
			validation: [{ message: "test error" }],
		};

		const normalized = normalizeError(fastifyErrorWithDifferentCode);

		// Should fall through to generic error handling
		expect(normalized.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		expect(normalized.message).toBe("Internal Server Error");
		expect(normalized.statusCode).toBe(500);
		expect(normalized.details).toBe("[object Object]");
	});

	it("should handle production environment with non-Error objects", () => {
		const originalEnv = process.env.NODE_ENV;
		vi.stubEnv("NODE_ENV", "production");

		const loggerErrorSpy = vi.spyOn(rootLogger, "error");

		const nonErrorObject = { someProperty: "value" };
		const normalized = normalizeError(nonErrorObject);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: undefined,
		});

		expect(loggerErrorSpy).toHaveBeenCalledWith({
			msg: "Internal Server Error (details suppressed)",
			originalError: nonErrorObject,
			details: "[object Object]",
		});

		// Restore environment
		if (originalEnv !== undefined) {
			vi.stubEnv("NODE_ENV", originalEnv);
		} else {
			vi.unstubAllEnvs();
		}
		loggerErrorSpy.mockRestore();
	});

	it("should handle number errors", () => {
		const numberError = 42;

		const normalized = normalizeError(numberError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "42",
		});
	});

	it("should handle boolean errors", () => {
		const booleanError = false;

		const normalized = normalizeError(booleanError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "false",
		});
	});

	it("should handle symbol errors", () => {
		const symbolError = Symbol("test");

		const normalized = normalizeError(symbolError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "Symbol(test)",
		});
	});

	it("should handle function errors", () => {
		const functionError = () => "test";

		const normalized = normalizeError(functionError);

		expect(normalized.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		expect(normalized.message).toBe("Internal Server Error");
		expect(normalized.statusCode).toBe(500);
		// Function toString() varies by environment, just check it's a string
		expect(typeof normalized.details).toBe("string");
	});

	it("should handle objects with non-string message property", () => {
		const errorWithNumberMessage = {
			message: 123,
			someOther: "field",
		};

		const normalized = normalizeError(errorWithNumberMessage);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "123",
		});
	});

	it("should handle objects with null message property", () => {
		const errorWithNullMessage = {
			message: null,
			someOther: "field",
		};

		const normalized = normalizeError(errorWithNullMessage);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "null",
		});
	});

	it("should handle objects with undefined message property", () => {
		const errorWithUndefinedMessage = {
			message: undefined,
			someOther: "field",
		};

		const normalized = normalizeError(errorWithUndefinedMessage);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
			details: "undefined",
		});
	});
});
