export enum SetupErrorCode {
	// File operation errors
	FILE_OP_FAILED = "FILE_OP_FAILED",
	BACKUP_FAILED = "BACKUP_FAILED",
	COMMIT_FAILED = "COMMIT_FAILED",
	RESTORE_FAILED = "RESTORE_FAILED",
	CLEANUP_FAILED = "CLEANUP_FAILED",

	// Validation and initialization errors
	VALIDATION_FAILED = "VALIDATION_FAILED",
	ENV_INIT_FAILED = "ENV_INIT_FAILED",

	// Generic errors
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface SetupErrorContext {
	operation?: string;
	filePath?: string;
	details?: unknown;
	[key: string]: unknown;
}

export class SetupError extends Error {
	public readonly code: SetupErrorCode;
	public readonly context: SetupErrorContext;
	public override readonly cause?: Error;

	constructor(
		code: SetupErrorCode,
		message: string,
		context: SetupErrorContext = {},
		cause?: Error,
	) {
		super(message);
		this.name = "SetupError";
		this.code = code;
		this.context = context;
		this.cause = cause;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SetupError);
		}
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

	getDetailedMessage(): string {
		const contextStr = Object.entries(this.context)
			.map(([key, value]) => {
				const serialized = (() => {
					if (value === undefined) return "undefined";
					if (value === null) return "null";
					if (typeof value === "bigint") return value.toString();
					if (typeof value === "object") {
						try {
							return JSON.stringify(value);
						} catch {
							return "<unserializable>";
						}
					}
					return String(value);
				})();
				return `${key}: ${serialized}`;
			})
			.join(", ");

		let message = `[${this.code}] ${this.message}`;
		if (contextStr) {
			message += ` (${contextStr})`;
		}
		if (this.cause) {
			message += `\nCaused by: ${this.cause.message}`;
		}
		return message;
	}
}
