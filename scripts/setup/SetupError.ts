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
		if ((Error as ErrorConstructor).captureStackTrace)
			(Error as ErrorConstructor).captureStackTrace(this, SetupError);
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			cause: this.cause
				? { name: this.cause.name, message: this.cause.message }
				: undefined,
		};
	}
}
