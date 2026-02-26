import { promises as fs } from "node:fs";
import * as dotenv from "dotenv";
import {
	cleanupTemp,
	commitTemp,
	ensureBackup,
	errToError,
	fileExists,
	readEnv,
	restoreBackup,
	writeTemp,
} from "./AtomicEnvWriter";
import { SetupError, SetupErrorCode } from "./SetupError";

export const DEFAULT_ENV_FILE = ".env";
export const DEFAULT_ENV_BACKUP_FILE = ".env.backup";
export const DEFAULT_ENV_TEMP_FILE = ".env.tmp";

export type EnvPaths = {
	envFile?: string;
	backupFile?: string;
	tempFile?: string;
};

export type InitEnvOptions = EnvPaths & {
	ci: boolean;
	templateCiFile?: string;
	templateDevcontainerFile?: string;
	restoreFromBackup?: boolean;
};

export type UpdateEnvOptions = EnvPaths & {
	createBackup?: boolean;
	restoreFromBackup?: boolean;
};

function escapeEnvValue(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r");
}

function serializeEnvVars(vars: Record<string, string>): string {
	const entries = Object.entries(vars);
	if (entries.length === 0) return "";
	return `${entries
		.map(([key, value]) => `${key}="${escapeEnvValue(value)}"`)
		.join("\n")}\n`;
}

function resolvePaths(paths?: EnvPaths): Required<EnvPaths> {
	const envFile = paths?.envFile ?? DEFAULT_ENV_FILE;

	// For the default env file, keep the canonical names used elsewhere in setup.
	// For overrides (e.g. .env_test), derive adjacent backup/temp files.
	const backupFile =
		paths?.backupFile ??
		(envFile === DEFAULT_ENV_FILE
			? DEFAULT_ENV_BACKUP_FILE
			: `${envFile}.backup`);
	const tempFile =
		paths?.tempFile ??
		(envFile === DEFAULT_ENV_FILE ? DEFAULT_ENV_TEMP_FILE : `${envFile}.tmp`);

	return {
		envFile,
		backupFile,
		tempFile,
	};
}

export async function checkEnvFile(
	envFile: string = DEFAULT_ENV_FILE,
): Promise<boolean> {
	return fileExists(envFile);
}

export async function initializeEnvFile(
	options: InitEnvOptions,
): Promise<void> {
	const { envFile, backupFile, tempFile } = resolvePaths(options);
	const restoreFromBackup = options.restoreFromBackup ?? false;

	const templateCiFile = options.templateCiFile ?? "envFiles/.env.ci";
	const templateDevcontainerFile =
		options.templateDevcontainerFile ?? "envFiles/.env.devcontainer";
	const templateFile = options.ci ? templateCiFile : templateDevcontainerFile;

	try {
		await fs.access(templateFile);
	} catch (e: unknown) {
		throw new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			`Configuration file '${templateFile}' is missing. Please create the file or use a different environment configuration.`,
			{ operation: "initializeEnvFile", filePath: templateFile },
			errToError(e),
		);
	}

	let nextContent = "";
	try {
		const fileContent = await fs.readFile(templateFile, { encoding: "utf-8" });
		const parsedEnv = dotenv.parse(fileContent);
		nextContent = serializeEnvVars(parsedEnv);
	} catch (e: unknown) {
		throw new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			"Failed to initialize env file",
			{
				operation: "initializeEnvFile",
				filePath: envFile,
				details: { templateFile },
			},
			errToError(e),
		);
	}

	// If `dotenv.parse` yields no keys, `serializeEnvVars` returns an empty string.
	// In `initializeEnvFile`, we must not pass that empty result to `writeTemp` and
	// `commitTemp`, otherwise we can wipe an existing `.env` file with empty content.
	if (nextContent === "") {
		if (await fileExists(envFile)) {
			console.warn(
				`Configuration file '${templateFile}' contains no environment variables; skipping overwrite of existing env file.`,
			);
			dotenv.config({ path: envFile });
			return;
		}
		throw new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			`Configuration file '${templateFile}' contains no environment variables; refusing to write an empty env file.`,
			{ operation: "initializeEnvFile", filePath: templateFile },
		);
	}

	try {
		// Protect existing env files from silent overwrite: if `envFile` already
		// exists, always take/refresh a backup before we write the new content.
		// (`restoreFromBackup` only controls whether we attempt automatic restore
		// on error; callers may still want a manual rollback path.)
		if (await fileExists(envFile)) {
			await ensureBackup(envFile, backupFile);
		}

		await writeTemp(tempFile, nextContent);
		await commitTemp(envFile, tempFile);

		dotenv.config({ path: envFile });
	} catch (e: unknown) {
		await cleanupTemp(tempFile);
		if (restoreFromBackup) {
			try {
				await restoreBackup(envFile, backupFile);
			} catch (restoreErr: unknown) {
				throw new SetupError(
					SetupErrorCode.RESTORE_FAILED,
					"Initialization failed and backup restoration also failed",
					{
						operation: "initializeEnvFile",
						filePath: envFile,
						originalError: errToError(e).message,
						restoreError: errToError(restoreErr).message,
					},
				);
			}
		}
		throw new SetupError(
			SetupErrorCode.ENV_INIT_FAILED,
			"Failed to initialize env file",
			{
				operation: "initializeEnvFile",
				filePath: envFile,
				details: { templateFile },
			},
			errToError(e),
		);
	}
}

export async function updateEnvVariable(
	config: Record<string, string | number | undefined>,
	options: UpdateEnvOptions = {},
): Promise<void> {
	const { envFile, backupFile, tempFile } = resolvePaths(options);
	const createBackup = options.createBackup ?? false;
	const restoreFromBackup = options.restoreFromBackup ?? false;

	try {
		const appliedEntries = Object.entries(config).filter(
			(entry): entry is [string, string | number] => entry[1] !== undefined,
		);
		if (appliedEntries.length === 0) {
			return;
		}

		const existingText = await readEnv(envFile);
		const parsedEnv = dotenv.parse(existingText);

		let changed = false;
		for (const [key, rawValue] of appliedEntries) {
			const value = String(rawValue);
			if (parsedEnv[key] !== value) {
				parsedEnv[key] = value;
				changed = true;
			}
			// Intentionally sync the running process environment for every key in
			// `appliedEntries`, even when `parsedEnv` already matches and `changed`
			// stays false (no file rewrite). We may return early on the no-op path,
			// but callers still expect `process.env` to reflect the effective env
			// state represented by `parsedEnv`.
			process.env[key] = value;
		}

		// Preserve the existing file (and its formatting/comments) when the update
		// results in no changes.
		if (!changed) {
			return;
		}

		if (createBackup) {
			await ensureBackup(envFile, backupFile);
		}

		// When we do have changes, we intentionally rewrite the file in a canonical
		// format (dotenv.parse + serialize). This will drop comments/blank lines.
		const nextContent = serializeEnvVars(parsedEnv);
		await writeTemp(tempFile, nextContent);
		await commitTemp(envFile, tempFile);
	} catch (e: unknown) {
		await cleanupTemp(tempFile);
		if (restoreFromBackup) {
			try {
				await restoreBackup(envFile, backupFile);
			} catch (restoreErr: unknown) {
				throw new SetupError(
					SetupErrorCode.RESTORE_FAILED,
					"Update failed and backup restoration also failed",
					{
						operation: "updateEnvVariable",
						filePath: envFile,
						originalError: errToError(e).message,
						restoreError: errToError(restoreErr).message,
					},
				);
			}
		}
		throw new SetupError(
			SetupErrorCode.FILE_OP_FAILED,
			"Failed to update .env file",
			{ operation: "updateEnvVariable", filePath: envFile },
			errToError(e),
		);
	}
}
