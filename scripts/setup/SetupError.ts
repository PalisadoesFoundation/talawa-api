/**
 * Error codes for setup script operations.
 * Each code represents a specific category of setup failure.
 */
export enum SetupErrorCode {
	/** File operation failed (read, write, delete, etc.) */
	FILE_OP_FAILED = "FILE_OP_FAILED",
	/** Input validation or data format validation failed */
	VALIDATION_FAILED = "VALIDATION_FAILED",
	/** Environment initialization failed */
	ENV_INIT_FAILED = "ENV_INIT_FAILED",
	/** Backup operation failed */
	BACKUP_FAILED = "BACKUP_FAILED",
	/** Commit operation failed */
	COMMIT_FAILED = "COMMIT_FAILED",
	/** Restore operation failed */
	RESTORE_FAILED = "RESTORE_FAILED",
}

/**
 * Context information for a setup error.
 * Provides additional details about the operation that failed.
 */
export interface SetupErrorContext {
	/** The operation that was being performed when the error occurred */
	operation: string;
	/** Optional file path related to the operation */
	filePath?: string;
	/** Optional additional details about the error */
	details?: Record<string, unknown>;
}

/**
 * Custom error class for setup script operations.
 * Provides structured error information with error codes, context, and optional cause.
 *
 * @example
 * ```typescript
 * throw new SetupError(
 *   SetupErrorCode.FILE_OP_FAILED,
 *   'Failed to read configuration file',
 *   { operation: 'readConfig', filePath: '/path/to/config.json' },
 *   originalError
 * );
 * ```
 */
export class SetupError extends Error {
	public readonly code: SetupErrorCode;
	public readonly context: SetupErrorContext;

	/**
	 * Creates a new SetupError instance.
	 *
	 * @param code - The error code identifying the type of failure
	 * @param message - Human-readable error message
	 * @param context - Additional context about the operation that failed
	 * @param cause - Optional underlying error that caused this error
	 */
	constructor(
		code: SetupErrorCode,
		message: string,
		context: SetupErrorContext,
		cause?: unknown,
	) {
		super(message, cause !== undefined ? { cause } : undefined);
		this.name = "SetupError";
		this.code = code;
		this.context = context;

		// Error.captureStackTrace is a V8-specific API
		if ("captureStackTrace" in Error) {
			Error.captureStackTrace(this, SetupError);
		}
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			cause:
				this.cause instanceof Error
					? { name: this.cause.name, message: this.cause.message }
					: this.cause,
		};
	}
}
