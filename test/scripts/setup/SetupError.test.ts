import { describe, expect, it } from "vitest";
import {
	SetupError,
	SetupErrorCode,
	type SetupErrorContext,
} from "../../../scripts/setup/SetupError";

describe("SetupError", () => {
	const mockContext = {
		operation: "test-operation",
		filePath: "/test/path",
		details: { key: "value" },
	} satisfies SetupErrorContext;

	it("should create an instance with correct properties", () => {
		const error = new SetupError(
			SetupErrorCode.FILE_OP_FAILED,
			"Test error message",
			mockContext,
		);

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(SetupError);
		expect(error.name).toBe("SetupError");
		expect(error.message).toBe("Test error message");
		expect(error.code).toBe(SetupErrorCode.FILE_OP_FAILED);
		expect(error.context).toEqual(mockContext);
		expect(error.cause).toBeUndefined();
	});

	it("should create an instance with a cause", () => {
		const originalError = new Error("Original error");
		const error = new SetupError(
			SetupErrorCode.VALIDATION_FAILED,
			"Validation failed",
			mockContext,
			originalError,
		);

		expect(error.cause).toBe(originalError);
	});

	it("should create an instance with a non-Error cause", () => {
		const cause = "Something went wrong";
		const error = new SetupError(
			SetupErrorCode.VALIDATION_FAILED,
			"Validation failed",
			mockContext,
			cause,
		);

		expect(error.cause).toBe(cause);
		const json = error.toJSON();
		expect(json.cause).toBe(cause);
	});

	it("should serialize non-primitive object cause safely", () => {
		// Create a circular object to verify safety
		const cause: Record<string, unknown> = { data: "big data" };
		cause["self"] = cause;

		const error = new SetupError(
			SetupErrorCode.VALIDATION_FAILED,
			"Validation failed",
			mockContext,
			cause,
		);

		expect(error.cause).toBe(cause);
		const json = error.toJSON();

		// Should not match the original circular object
		expect(json.cause).not.toBe(cause);
		// Should return a safe summary object
		expect(json.cause).toEqual({ type: "object" });
	});

	it("should serialize to JSON correctly", () => {
		const originalError = new Error("Original error");
		const error = new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			"Env init failed",
			mockContext,
			originalError,
		);

		const json = error.toJSON();

		expect(json).toEqual({
			name: "SetupError",
			message: "Env init failed",
			code: SetupErrorCode.ENV_INIT_FAILED,
			context: mockContext,
			cause: {
				name: "Error",
				message: "Original error",
			},
		});
	});

	it("should serialize to JSON without cause when not provided", () => {
		const error = new SetupError(
			SetupErrorCode.BACKUP_FAILED,
			"Backup failed",
			mockContext,
		);

		const json = error.toJSON();

		expect(json.cause).toBeUndefined();
	});

	it("should capture stack trace", () => {
		const error = new SetupError(
			SetupErrorCode.COMMIT_FAILED,
			"Commit failed",
			mockContext,
		);

		expect(error.stack).toBeDefined();
		expect(typeof error.stack).toBe("string");
	});

	it("should support all error codes", () => {
		const codes = Object.values(SetupErrorCode);
		for (const code of codes) {
			const error = new SetupError(code, "Message", { operation: "test" });
			expect(error.code).toBe(code);
		}
	});
});
