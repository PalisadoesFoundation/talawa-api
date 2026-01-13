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
});
