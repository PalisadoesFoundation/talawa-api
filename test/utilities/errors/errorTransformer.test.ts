import { describe, expect, it } from "vitest";
import { ZodError, ZodIssueCode } from "zod";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { normalizeError } from "~/src/utilities/errors/errorTransformer";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

describe("normalizeError", () => {
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
				received: "number",
				path: ["name"],
				message: "Expected string, received number",
			},
			{
				code: ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
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

	it("should normalize Zod validation errors without flatten method", () => {
		const zodError = new ZodError([
			{
				code: ZodIssueCode.invalid_type,
				expected: "string",
				received: "number",
				path: ["name"],
				message: "Expected string, received number",
			},
		]);

		// Create a proxy that simulates a ZodError without flatten method
		const zodErrorWithoutFlatten = new Proxy(zodError, {
			get(target, prop) {
				if (prop === "flatten") {
					return undefined;
				}
				return Reflect.get(target, prop);
			},
		});

		const normalized = normalizeError(zodErrorWithoutFlatten);

		expect(normalized.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(normalized.message).toBe("Invalid input");
		expect(normalized.statusCode).toBe(400);
		expect(normalized.details).toEqual(zodError.issues);
	});

	it("should normalize generic Error objects", () => {
		const genericError = new Error("Something went wrong");

		const normalized = normalizeError(genericError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
		});
	});

	it("should handle errors without message property", () => {
		const errorWithoutMessage = { someProperty: "value" };

		const normalized = normalizeError(errorWithoutMessage);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
		});
	});

	it("should handle null/undefined errors", () => {
		const normalizedNull = normalizeError(null);
		const normalizedUndefined = normalizeError(undefined);

		expect(normalizedNull).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
		});

		expect(normalizedUndefined).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
		});
	});

	it("should handle string errors", () => {
		const stringError = "Something bad happened";

		const normalized = normalizeError(stringError);

		expect(normalized).toEqual({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
		});
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
});
