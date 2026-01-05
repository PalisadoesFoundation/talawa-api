import type { GraphQLError } from "graphql";
import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import {
	formatGraphQLErrors,
	normalizeErrorCode,
} from "~/src/utilities/formatGraphQLErrors";

describe("formatGraphQLErrors", () => {
	describe("normalizeErrorCode", () => {
		it("should return the code itself if it is a valid ErrorCode", () => {
			expect(normalizeErrorCode(ErrorCode.NOT_FOUND)).toBe(ErrorCode.NOT_FOUND);
		});

		it("should return INTERNAL_SERVER_ERROR for unknown codes", () => {
			expect(normalizeErrorCode("UNKNOWN_CODE")).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
		});

		it("should normalize 'too_many_requests' to RATE_LIMIT_EXCEEDED", () => {
			expect(normalizeErrorCode("too_many_requests")).toBe(
				ErrorCode.RATE_LIMIT_EXCEEDED,
			);
		});

		it("should normalize 'forbidden_action_on_arguments_associated_resources' to UNAUTHORIZED", () => {
			expect(
				normalizeErrorCode(
					"forbidden_action_on_arguments_associated_resources",
				),
			).toBe(ErrorCode.UNAUTHORIZED);
		});

		it("should normalize 'invalid_credentials' to UNAUTHENTICATED", () => {
			expect(normalizeErrorCode("invalid_credentials")).toBe(
				ErrorCode.UNAUTHENTICATED,
			);
		});

		it("should normalize 'account_locked' to UNAUTHORIZED", () => {
			expect(normalizeErrorCode("account_locked")).toBe(ErrorCode.UNAUTHORIZED);
		});

		it("should normalize 'unauthorized_action' to INSUFFICIENT_PERMISSIONS", () => {
			expect(normalizeErrorCode("unauthorized_action")).toBe(
				ErrorCode.INSUFFICIENT_PERMISSIONS,
			);
		});

		it("should normalize 'unauthorized_arguments' to INSUFFICIENT_PERMISSIONS", () => {
			expect(normalizeErrorCode("unauthorized_arguments")).toBe(
				ErrorCode.INSUFFICIENT_PERMISSIONS,
			);
		});
	});

	describe("formatGraphQLErrors", () => {
		it("should format errors and call logger", () => {
			const errors = [
				{
					message: "Test error",
					locations: [{ line: 1, column: 1 }],
					path: ["test"],
					extensions: {
						code: ErrorCode.NOT_FOUND,
						details: { info: "details" },
						stack: "should be removed",
					},
				},
			] as unknown as GraphQLError[];

			const logger = { error: vi.fn() };
			const correlationId = "test-correlation-id";

			const result = formatGraphQLErrors(errors, correlationId, logger);

			expect(result.formatted).toBeDefined();
			expect(result.formatted[0]?.message).toBe("Test error");
			expect(result.formatted[0]?.extensions.code).toBe(ErrorCode.NOT_FOUND);
			expect(result.formatted[0]?.extensions.correlationId).toBe(correlationId);
			expect(result.formatted[0]?.extensions.stack).toBeUndefined();
			expect(result.statusCode).toBe(404); // NOT_FOUND maps to 404

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "GraphQL error",
					correlationId,
					statusCode: 404,
				}),
			);
		});

		it("should sanitize sensitive keys in extensions", () => {
			const errors = [
				{
					message: "Sensitive error",
					extensions: {
						stack: "stack trace",
						internal: "internal info",
						debug: "debug info",
						raw: "raw error",
						secrets: "my secret",
						exception: "exception details",
						safeKey: "safe value",
						error: {
							stack: "nested stack",
							message: "nested message", // safe
						},
					},
				},
			] as unknown as GraphQLError[];

			const result = formatGraphQLErrors(errors, "id");

			const ext = result.formatted[0]?.extensions;
			expect(ext).toBeDefined();
			expect(ext?.stack).toBeUndefined();
			expect(ext?.internal).toBeUndefined();
			expect(ext?.debug).toBeUndefined();
			expect(ext?.raw).toBeUndefined();
			expect(ext?.secrets).toBeUndefined();
			expect(ext?.exception).toBeUndefined();
			expect(ext?.safeKey).toBe("safe value");

			// Check nested error object
			expect(ext?.error).toEqual({ message: "nested message" });
		});
	});
});
