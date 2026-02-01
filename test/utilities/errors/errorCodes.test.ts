import { describe, expect, it } from "vitest";
import {
	ERROR_CODE_TO_HTTP_STATUS,
	ErrorCode,
	type StandardErrorPayload,
} from "~/src/utilities/errors/errorCodes";

describe("ErrorCode enum", () => {
	it("should have all expected error codes", () => {
		const expectedCodes = [
			"unauthenticated",
			"token_expired",
			"token_invalid",
			"unauthorized",
			"insufficient_permissions",
			"invalid_arguments",
			"invalid_input",
			"not_found",
			"already_exists",
			"conflict",
			"rate_limit_exceeded",
			"deprecated",
			"internal_server_error",
			"database_error",
			"external_service_error",
			"arguments_associated_resources_not_found",
			"forbidden_action_on_arguments_associated_resources",
			"forbidden_action",
			"unexpected",
			"unauthorized_action_on_arguments_associated_resources",
		];

		expectedCodes.forEach((code) => {
			expect(Object.values(ErrorCode)).toContain(code);
		});

		// Exhaustiveness check to ensure no new error codes are added without updating this test
		// keys need to be equal to values length since it's a string enum
		expect(expectedCodes.length).toBe(Object.keys(ErrorCode).length);
	});

	it("should have string values matching the enum keys", () => {
		expect(ErrorCode.UNAUTHENTICATED).toBe("unauthenticated");
		expect(ErrorCode.NOT_FOUND).toBe("not_found");
		expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe("internal_server_error");
	});
});

describe("ERROR_CODE_TO_HTTP_STATUS mapping", () => {
	it("should map authentication errors to 401", () => {
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.UNAUTHENTICATED]).toBe(401);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.TOKEN_EXPIRED]).toBe(401);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.TOKEN_INVALID]).toBe(401);
	});

	it("should map authorization errors to 403", () => {
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.UNAUTHORIZED]).toBe(403);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.INSUFFICIENT_PERMISSIONS]).toBe(
			403,
		);
		expect(
			ERROR_CODE_TO_HTTP_STATUS[
				ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES
			],
		).toBe(403);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.FORBIDDEN_ACTION]).toBe(403);
		expect(
			ERROR_CODE_TO_HTTP_STATUS[
				ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES
			],
		).toBe(403);
	});

	it("should map validation errors to 400", () => {
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.INVALID_ARGUMENTS]).toBe(400);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.INVALID_INPUT]).toBe(400);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.DEPRECATED]).toBe(400);
	});

	it("should map resource errors correctly", () => {
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.NOT_FOUND]).toBe(404);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.ALREADY_EXISTS]).toBe(409);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.CONFLICT]).toBe(409);
		expect(
			ERROR_CODE_TO_HTTP_STATUS[
				ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND
			],
		).toBe(404);
	});

	it("should map rate limiting to 429", () => {
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429);
	});

	it("should map server errors to 5xx", () => {
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.INTERNAL_SERVER_ERROR]).toBe(
			500,
		);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.DATABASE_ERROR]).toBe(500);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.EXTERNAL_SERVICE_ERROR]).toBe(
			502,
		);
		expect(ERROR_CODE_TO_HTTP_STATUS[ErrorCode.UNEXPECTED]).toBe(500);
	});

	it("should have mappings for all error codes", () => {
		Object.values(ErrorCode).forEach((code) => {
			expect(ERROR_CODE_TO_HTTP_STATUS[code]).toBeDefined();
			expect(typeof ERROR_CODE_TO_HTTP_STATUS[code]).toBe("number");
		});
	});
});

describe("StandardErrorPayload type", () => {
	// These tests are primarily for TypeScript compile-time validation to ensure
	// StandardErrorPayload accepts the expected field combinations.
	// The runtime assertions serve as sanity checks.
	it("should accept valid error payload", () => {
		const payload: StandardErrorPayload = {
			error: {
				code: ErrorCode.NOT_FOUND,
				message: "Resource not found",
				details: { id: "123" },
				correlationId: "req-456",
			},
		};

		expect(payload.error.code).toBe(ErrorCode.NOT_FOUND);
		expect(payload.error.message).toBe("Resource not found");
		expect(payload.error.details).toEqual({ id: "123" });
		expect(payload.error.correlationId).toBe("req-456");
	});

	it("should accept payload without optional fields", () => {
		const payload: StandardErrorPayload = {
			error: {
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Something went wrong",
			},
		};

		expect(payload.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		expect(payload.error.message).toBe("Something went wrong");
		expect(payload.error.details).toBeUndefined();
		expect(payload.error.correlationId).toBeUndefined();
	});
});
