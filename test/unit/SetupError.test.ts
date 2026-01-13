import { describe, expect, it } from "vitest";
import {
	SetupError,
	SetupErrorCode,
	type SetupErrorContext,
} from "../../scripts/setup/SetupError";

describe("SetupError", () => {
	it("should create an instance with correct properties", () => {
		const code = SetupErrorCode.FILE_OP_FAILED;
		const message = "File operation failed";
		const context: SetupErrorContext = {
			operation: "read",
			filePath: "/path/to/file",
		};
		const cause = new Error("Original error");

		const error = new SetupError(code, message, context, cause);

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(SetupError);
		expect(error.name).toBe("SetupError");
		expect(error.code).toBe(code);
		expect(error.message).toBe(message);
		expect(error.context).toEqual(context);
		expect(error.cause).toBe(cause);
	});

	it("should work without a cause", () => {
		const code = SetupErrorCode.VALIDATION_FAILED;
		const message = "Validation failed";
		const context: SetupErrorContext = { operation: "validate" };

		const error = new SetupError(code, message, context);

		expect(error.cause).toBeUndefined();
	});

	it("should capture stack trace", () => {
		const error = new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			"Env init failed",
			{ operation: "init" },
		);
		expect(error.stack).toBeDefined();
	});

	it("should correctly serialize to JSON", () => {
		const code = SetupErrorCode.BACKUP_FAILED;
		const message = "Backup process failed";
		const context: SetupErrorContext = {
			operation: "backup",
			details: { reason: "disk full", attempts: 3 },
		};
		const cause = new Error("Disk full");
		const error = new SetupError(code, message, context, cause);

		const json = error.toJSON();

		expect(json).toEqual({
			name: "SetupError",
			code,
			message,
			context,
			cause,
			stack: error.stack,
		});
		expect(json.context.details).toEqual({ reason: "disk full", attempts: 3 });
	});

	it("should correctly serialize to JSON without a cause", () => {
		const code = SetupErrorCode.RESTORE_FAILED;
		const message = "Restore process failed";
		const context: SetupErrorContext = { operation: "restore" };
		const error = new SetupError(code, message, context);

		const json = error.toJSON();

		expect(json.cause).toBeUndefined();
		expect(json.code).toBe(code);
		expect(json.message).toBe(message);
	});

	it("should work with COMMIT_FAILED error code", () => {
		const code = SetupErrorCode.COMMIT_FAILED;
		const message = "Git commit failed";
		const context: SetupErrorContext = { operation: "git commit" };

		const error = new SetupError(code, message, context);

		expect(error.code).toBe(SetupErrorCode.COMMIT_FAILED);
		expect(error.message).toBe(message);
	});
});
