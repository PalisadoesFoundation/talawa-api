export enum SetupErrorCode {
	FILE_OP_FAILED = "FILE_OP_FAILED",
	VALIDATION_FAILED = "VALIDATION_FAILED",
	ENV_INIT_FAILED = "ENV_INIT_FAILED",
	BACKUP_FAILED = "BACKUP_FAILED",
	COMMIT_FAILED = "COMMIT_FAILED",
	RESTORE_FAILED = "RESTORE_FAILED",
}

export interface SetupErrorContext {
	operation: string;
	filePath?: string;
	details?: Record<string, unknown>;
}

export class SetupError extends Error {
	public readonly code: SetupErrorCode;

	public readonly context: SetupErrorContext;

	public override readonly cause?: Error;

	constructor(
		code: SetupErrorCode,
		message: string,
		context: SetupErrorContext,
		cause?: Error,
	) {
		super(message);
		this.name = "SetupError";
		this.code = code;
		this.context = context;
		this.cause = cause;
		const ErrorWithStack = Error as unknown as {
			// biome-ignore lint/complexity/noBannedTypes: Required by Error.captureStackTrace signature
			captureStackTrace?: (target: object, constructorOpt?: Function) => void;
		};

		if (typeof ErrorWithStack.captureStackTrace === "function") {
			ErrorWithStack.captureStackTrace(this, SetupError);
		}
	}

	/**
	 * Returns a JSON representation of the error.
	 * This is useful for standardized logging and serialization.
	 */
	public toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			context: this.context,
			cause: this.cause,
			stack: this.stack,
		};
	}
}
