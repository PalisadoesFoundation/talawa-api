import { describe, expect, it } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("TalawaGraphQLError", () => {
	it("should use fallback message for unmapped error codes", () => {
		const error = new TalawaGraphQLError({
			extensions: {
				code: "UNMAPPED_CODE_NOT_IN_DEFAULTS" as unknown as ErrorCode,
			},
		});

		expect(error.message).toBe("An error occurred");
	});

	it("should use default message for known error codes", () => {
		const error = new TalawaGraphQLError({
			extensions: {
				code: ErrorCode.NOT_FOUND,
			},
		});

		expect(error.message).toBe("Requested resource not found.");
	});

	it("should use custom message when provided", () => {
		const customMessage = "Custom error message";
		const error = new TalawaGraphQLError({
			message: customMessage,
			extensions: {
				code: ErrorCode.NOT_FOUND,
			},
		});

		expect(error.message).toBe(customMessage);
	});

	it("should preserve extensions in error object", () => {
		const extensions = {
			code: ErrorCode.INVALID_INPUT,
			details: { field: "email", value: "invalid-email" },
		};

		const error = new TalawaGraphQLError({
			extensions,
		});

		expect(error.extensions).toEqual(extensions);
	});

	it("should handle legacy error codes", () => {
		const error = new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated" as unknown as ErrorCode,
			},
		});

		expect(error.message).toBe(
			"You must be authenticated to perform this action.",
		);
	});

	it("should handle error codes with details", () => {
		const error = new TalawaGraphQLError({
			extensions: {
				code: ErrorCode.UNAUTHORIZED,
				details: { userId: "123", action: "delete" },
			},
		});

		expect(error.message).toBe("Unauthorized access.");
		expect(error.extensions.details).toEqual({
			userId: "123",
			action: "delete",
		});
	});

	it("should handle error codes with custom HTTP status", () => {
		const error = new TalawaGraphQLError({
			extensions: {
				code: ErrorCode.NOT_FOUND,
				httpStatus: 404,
			},
		});

		expect(error.extensions.httpStatus).toBe(404);
	});
});
