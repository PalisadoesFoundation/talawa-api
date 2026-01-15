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
		expect(error.name).toBe("SetupError");
		expect(error.code).toBe(code);
		expect(error.message).toBe(message);
		expect(error.context).toEqual(context);
	});

	it("should capture stack trace", () => {
		const error = new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			"Env init failed",
			{ operation: "init" },
		);
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("SetupError");
		expect(error.stack).toContain("SetupError.test.ts");
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

		// Verify serializability and integrity after round-trip
		const serialized = JSON.parse(JSON.stringify(json));
		expect(serialized.name).toBe("SetupError");
		expect(serialized.code).toBe(code);
		expect(serialized.context.details.reason).toBe("disk full");
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

	it("should handle complex metadata in context.details", () => {
		const context: SetupErrorContext = {
			operation: "complex-op",
			details: {
				nested: { array: [1, 2, 3], active: true },
				timestamp: new Date().toISOString(),
				nullValue: null,
			},
		};
		const error = new SetupError(
			SetupErrorCode.VALIDATION_FAILED,
			"Complex error",
			context,
		);

		expect(error.context.details).toEqual(context.details);
		const json = error.toJSON();
		expect(json.context.details).toEqual(context.details);
	});
});
