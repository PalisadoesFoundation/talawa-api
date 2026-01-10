/** Atomic .env helper: backup, atomic commit, restore, cleanup */
import { promises as fs } from "node:fs";

export enum SetupErrorCode {
	// File operation errors
	FILE_OP_FAILED = "FILE_OP_FAILED",
	BACKUP_FAILED = "BACKUP_FAILED",
	COMMIT_FAILED = "COMMIT_FAILED",
	RESTORE_FAILED = "RESTORE_FAILED",
	CLEANUP_FAILED = "CLEANUP_FAILED",

	// Generic errors
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface SetupErrorContext {
	operation?: string;
	filePath?: string;
	[key: string]: unknown;
}

function getErrCode(err: unknown): string | undefined {
	if (typeof err === "object" && err !== null && "code" in err) {
		return (err as { code?: unknown }).code as string | undefined;
	}
	return undefined;
}

function errToError(err: unknown): Error {
	return err instanceof Error ? err : new Error(String(err));
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

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SetupError);
		}
	}

	/**
	 * Get a detailed error message including context
	 */
	getDetailedMessage(): string {
		const contextStr = Object.entries(this.context)
			.map(([key, value]) => `${key}: ${value}`)
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

export interface AtomicWriteOptions {
	/**
	 * Path to the .env file (default: '.env')
	 */
	envFile?: string;

	/**
	 * Path to the backup file (default: '.env.backup')
	 */
	backupFile?: string;

	/**
	 * Path to the temporary file (default: '.env.tmp')
	 */
	tempFile?: string;

	/**
	 * Whether to create a backup before writing (default: true)
	 */
	createBackup?: boolean;

	/**
	 * Whether to automatically restore from backup on failure (default: true)
	 */
	autoRestore?: boolean;

	/**
	 * Encoding for file operations (default: 'utf-8')
	 */
	encoding?: BufferEncoding;
}

const DEFAULT_OPTIONS: Required<AtomicWriteOptions> = {
	envFile: ".env",
	backupFile: ".env.backup",
	tempFile: ".env.tmp",
	createBackup: true,
	autoRestore: true,
	encoding: "utf-8",
};

export async function ensureBackup(
	envFile: string,
	backupFile: string,
): Promise<void> {
	try {
		// Check if the env file exists
		await fs.access(envFile);

		// Create backup by copying the file
		await fs.copyFile(envFile, backupFile);
	} catch (e: unknown) {
		// If the file doesn't exist (ENOENT), it's okay - nothing to backup
		if (getErrCode(e) !== "ENOENT") {
			throw new SetupError(
				SetupErrorCode.BACKUP_FAILED,
				"Failed to create backup of .env file",
				{ operation: "ensureBackup", filePath: envFile },
				errToError(e),
			);
		}
	}
}

export async function writeTemp(
	tempFile: string,
	content: string,
	encoding: BufferEncoding = "utf-8",
): Promise<void> {
	try {
		await fs.writeFile(tempFile, content, encoding);
	} catch (e: unknown) {
		throw new SetupError(
			SetupErrorCode.FILE_OP_FAILED,
			"Failed to write temporary file",
			{ operation: "writeTemp", filePath: tempFile },
			errToError(e),
		);
	}
}

export async function commitTemp(
	envFile: string,
	tempFile: string,
): Promise<void> {
	try {
		// Try atomic rename first (works on same filesystem)
		await fs.rename(tempFile, envFile);
	} catch (_e: unknown) {
		// If rename fails (e.g., cross-filesystem), fall back to copy+delete
		try {
			await fs.copyFile(tempFile, envFile);
			await fs.unlink(tempFile);
		} catch (f: unknown) {
			throw new SetupError(
				SetupErrorCode.COMMIT_FAILED,
				"Failed to commit temporary file to .env",
				{ operation: "commitTemp", filePath: envFile },
				errToError(f),
			);
		}
	}
}

export async function restoreBackup(
	envFile: string,
	backupFile: string,
): Promise<void> {
	try {
		// Check if backup exists
		await fs.access(backupFile);

		// Restore from backup
		await fs.copyFile(backupFile, envFile);
	} catch (e: unknown) {
		// If backup doesn't exist (ENOENT), it's okay - nothing to restore
		if (getErrCode(e) !== "ENOENT") {
			throw new SetupError(
				SetupErrorCode.RESTORE_FAILED,
				"Failed to restore .env from backup",
				{ operation: "restoreBackup", filePath: backupFile },
				errToError(e),
			);
		}
	}
}

export async function cleanupTemp(tempFile: string): Promise<void> {
	try {
		await fs.unlink(tempFile);
	} catch (e: unknown) {
		// Only warn if it's not a "file not found" error
		if (getErrCode(e) !== "ENOENT") {
			console.warn(
				`Warning: Failed to cleanup temporary file: ${errToError(e).message}`,
			);
		}
		// Never throw - cleanup is best-effort
	}
}

export async function atomicWriteEnv(
	content: string,
	options: AtomicWriteOptions = {},
): Promise<void> {
	// Merge options with defaults
	const opts: Required<AtomicWriteOptions> = {
		...DEFAULT_OPTIONS,
		...options,
	};

	const { envFile, backupFile, tempFile, createBackup, autoRestore, encoding } =
		opts;

	try {
		// Step 1: Create backup if enabled
		if (createBackup) {
			await ensureBackup(envFile, backupFile);
		}

		// Step 2: Write to temporary file
		await writeTemp(tempFile, content, encoding);

		// Step 3: Atomically commit temporary file
		await commitTemp(envFile, tempFile);

		// Step 4: Cleanup (best-effort, won't throw)
		await cleanupTemp(tempFile);
	} catch (error: unknown) {
		// On failure, attempt to restore from backup
		if (autoRestore && createBackup) {
			try {
				await restoreBackup(envFile, backupFile);
			} catch (restoreError) {
				// If restore also fails, include both errors in the message
				throw new SetupError(
					SetupErrorCode.RESTORE_FAILED,
					"Write failed and backup restoration also failed",
					{
						operation: "atomicWriteEnv",
						originalError:
							error instanceof Error ? error.message : String(error),
						restoreError:
							restoreError instanceof Error
								? restoreError.message
								: String(restoreError),
					},
				);
			}
		}

		// Attempt cleanup even on failure (best-effort)
		await cleanupTemp(tempFile);

		// Re-throw the original error
		throw error instanceof Error ? error : errToError(error);
	}
}

export async function readEnv(
	envFile: string = ".env",
	encoding: BufferEncoding = "utf-8",
): Promise<string> {
	try {
		return await fs.readFile(envFile, encoding);
	} catch (e: unknown) {
		// Return empty string if file doesn't exist
		if (getErrCode(e) === "ENOENT") {
			return "";
		}

		throw new SetupError(
			SetupErrorCode.FILE_OP_FAILED,
			"Failed to read .env file",
			{ operation: "readEnv", filePath: envFile },
			errToError(e),
		);
	}
}

async function _cleanupBackup(
	backupFile: string = ".env.backup",
): Promise<void> {
	try {
		await fs.unlink(backupFile);
	} catch (e: unknown) {
		// Only warn if it's not a "file not found" error
		if (getErrCode(e) !== "ENOENT") {
			console.warn(
				`Warning: Failed to cleanup backup file: ${errToError(e).message}`,
			);
		}
		// Never throw - cleanup is best-effort
	}
}

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}
