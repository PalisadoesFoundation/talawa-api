/** Atomic .env helper: backup, atomic commit, restore, cleanup */
import { promises as fs } from "node:fs";
import { SetupError, SetupErrorCode } from "./SetupError";

export function getErrCode(err: unknown): string | undefined {
	if (typeof err === "object" && err !== null && "code" in err) {
		return (err as { code?: unknown }).code as string | undefined;
	}
	return undefined;
}

/**
 * Normalize unknown error-like values into an Error instance.
 */
export function errToError(err: unknown): Error {
	return err instanceof Error ? err : new Error(String(err));
}

export interface AtomicWriteOptions {
	envFile?: string;
	backupFile?: string;
	tempFile?: string;
	createBackup?: boolean;
	autoRestore?: boolean;
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

/**
 * Creates a backup of the .env file if it exists.
 * @param envFile - Path to the .env file to backup
 * @param backupFile - Path where the backup should be created
 * @throws {SetupError} When backup creation fails (except for missing source file)
 */
export async function ensureBackup(
	envFile: string,
	backupFile: string,
): Promise<void> {
	try {
		await fs.copyFile(envFile, backupFile);
	} catch (e: unknown) {
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

/**
 * Writes content to a temporary file.
 * @param tempFile - Path to the temporary file
 * @param content - Content to write
 * @param encoding - Text encoding (default: "utf-8")
 * @throws {SetupError} When file write fails
 */
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

/**
 * Atomically commits a temporary file to the final .env location.
 * Uses rename when possible, falls back to copy+unlink.
 * @param envFile - Target .env file path
 * @param tempFile - Source temporary file path
 * @throws {SetupError} When commit fails
 */
export async function commitTemp(
	envFile: string,
	tempFile: string,
): Promise<void> {
	try {
		await fs.rename(tempFile, envFile);
	} catch (_e: unknown) {
		const originalError = errToError(_e);
		try {
			await fs.copyFile(tempFile, envFile);
			try {
				await fs.unlink(tempFile);
			} catch (unlinkError: unknown) {
				throw new SetupError(
					SetupErrorCode.COMMIT_FAILED,
					"Temp file committed but cleanup failed",
					{
						operation: "commitTemp",
						filePath: envFile,
						originalError: originalError.message,
						unlinkError: errToError(unlinkError).message,
					},
					originalError,
				);
			}
		} catch (copyError: unknown) {
			throw new SetupError(
				SetupErrorCode.COMMIT_FAILED,
				"Failed to commit temporary file to .env",
				{
					operation: "commitTemp",
					filePath: envFile,
					originalError: originalError.message,
					fallbackError: errToError(copyError).message,
				},
				originalError,
			);
		}
	}
}

/**
 * Restores .env file from backup if backup exists.
 * @param envFile - Path to the .env file to restore
 * @param backupFile - Path to the backup file
 * @throws {SetupError} When restore fails (except for missing backup file)
 */
export async function restoreBackup(
	envFile: string,
	backupFile: string,
): Promise<void> {
	try {
		await fs.copyFile(backupFile, envFile);
	} catch (e: unknown) {
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

/**
 * Removes backup file if it exists.
 * @param backupFile - Path to the backup file (default: ".env.backup")
 */
export async function cleanupBackup(
	backupFile: string = ".env.backup",
): Promise<void> {
	try {
		await fs.unlink(backupFile);
	} catch (e: unknown) {
		if (getErrCode(e) !== "ENOENT") {
			console.warn(
				`Warning: Failed to cleanup backup file: ${errToError(e).message}`,
			);
		}
	}
}

/**
 * Removes temporary file if it exists.
 * @param tempFile - Path to the temporary file
 * @param logger - Optional logger for warnings (falls back to no-op)
 */
export async function cleanupTemp(
	tempFile: string,
	logger?: { warn: (msg: string) => void },
): Promise<void> {
	try {
		await fs.unlink(tempFile);
	} catch (e: unknown) {
		if (getErrCode(e) !== "ENOENT") {
			logger?.warn(
				`Warning: Failed to cleanup temporary file: ${errToError(e).message}`,
			);
		}
	}
}

/**
 * Atomically writes content to .env file with backup and restore capabilities.
 * @param content - Content to write to the .env file
 * @param options - Configuration options
 * @throws {SetupError} When write or restore operations fail
 */
export async function atomicWriteEnv(
	content: string,
	options: AtomicWriteOptions = {},
): Promise<void> {
	const opts: Required<AtomicWriteOptions> = {
		...DEFAULT_OPTIONS,
		...options,
	};

	const { envFile, backupFile, tempFile, createBackup, autoRestore, encoding } =
		opts;

	try {
		if (createBackup) {
			await ensureBackup(envFile, backupFile);
		}

		await writeTemp(tempFile, content, encoding);
		await commitTemp(envFile, tempFile);
	} catch (error: unknown) {
		if (autoRestore && createBackup) {
			try {
				await restoreBackup(envFile, backupFile);
			} catch (restoreError) {
				throw new SetupError(
					SetupErrorCode.RESTORE_FAILED,
					"Write failed and backup restoration also failed",
					{
						operation: "atomicWriteEnv",
						originalError: errToError(error).message,
						restoreError: errToError(restoreError).message,
					},
				);
			}
		}

		await cleanupTemp(tempFile);
		throw error instanceof Error ? error : errToError(error);
	}
}

/**
 * Reads content from .env file, returns empty string if file doesn't exist.
 * @param envFile - Path to the .env file (default: ".env")
 * @param encoding - Text encoding (default: "utf-8")
 * @returns Promise resolving to file content or empty string
 * @throws {SetupError} When file read fails (except for missing file)
 */
export async function readEnv(
	envFile: string = ".env",
	encoding: BufferEncoding = "utf-8",
): Promise<string> {
	try {
		return await fs.readFile(envFile, encoding);
	} catch (e: unknown) {
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

// (removed unused backup cleanup helper)

/**
 * Checks if a file exists.
 * @param filePath - Path to the file to check
 * @returns Promise resolving to true if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}
