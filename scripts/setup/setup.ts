import { promises as fs } from "node:fs";
import path, { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import { emailSetup } from "./emailSetup";
import { envFileBackup } from "./envFileBackup/envFileBackup";
import { promptConfirm, promptInput, promptList } from "./promptHelpers";
import { updateEnvVariable } from "./updateEnvVariable";
import {
	generateJwtSecret,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validateEmail,
	validatePort,
	validateURL,
} from "./validators";

// Re-export validators for backward compatibility
export {
	generateJwtSecret,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validateEmail,
	validatePort,
	validateURL,
} from "./validators";

// Define a union type of all allowed environment keys
export type SetupKey =
	| "CI"
	| "API_ADMINISTRATOR_USER_EMAIL_ADDRESS"
	| "RECAPTCHA_SECRET_KEY"
	| "API_BASE_URL"
	| "API_HOST"
	| "API_PORT"
	| "API_IS_APPLY_DRIZZLE_MIGRATIONS"
	| "API_IS_GRAPHIQL"
	| "API_IS_PINO_PRETTY"
	| "API_JWT_EXPIRES_IN"
	| "API_JWT_SECRET"
	| "API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS"
	| "API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET"
	| "API_LOG_LEVEL"
	| "API_MINIO_ACCESS_KEY"
	| "API_MINIO_END_POINT"
	| "API_MINIO_PORT"
	| "API_MINIO_SECRET_KEY"
	| "API_MINIO_TEST_END_POINT"
	| "API_MINIO_USE_SSL"
	| "API_POSTGRES_DATABASE"
	| "API_POSTGRES_HOST"
	| "API_POSTGRES_PASSWORD"
	| "API_POSTGRES_PORT"
	| "API_POSTGRES_SSL_MODE"
	| "API_POSTGRES_TEST_HOST"
	| "API_POSTGRES_USER"
	| "CLOUDBEAVER_ADMIN_NAME"
	| "CLOUDBEAVER_ADMIN_PASSWORD"
	| "CLOUDBEAVER_MAPPED_HOST_IP"
	| "CLOUDBEAVER_MAPPED_PORT"
	| "CLOUDBEAVER_SERVER_NAME"
	| "CLOUDBEAVER_SERVER_URL"
	| "MINIO_BROWSER"
	| "MINIO_API_MAPPED_HOST_IP"
	| "MINIO_API_MAPPED_PORT"
	| "MINIO_CONSOLE_MAPPED_HOST_IP"
	| "MINIO_CONSOLE_MAPPED_PORT"
	| "MINIO_ROOT_PASSWORD"
	| "MINIO_ROOT_USER"
	| "POSTGRES_DB"
	| "POSTGRES_MAPPED_HOST_IP"
	| "POSTGRES_MAPPED_PORT"
	| "POSTGRES_PASSWORD"
	| "POSTGRES_USER"
	| "CADDY_HTTP_MAPPED_PORT"
	| "CADDY_HTTPS_MAPPED_PORT"
	| "CADDY_HTTP3_MAPPED_PORT"
	| "CADDY_TALAWA_API_DOMAIN_NAME"
	| "CADDY_TALAWA_API_EMAIL"
	| "CADDY_TALAWA_API_HOST"
	| "CADDY_TALAWA_API_PORT"
	| "API_OTEL_ENABLED"
	| "API_OTEL_SAMPLING_RATIO"
	| "API_EMAIL_PROVIDER"
	| "AWS_SES_REGION"
	| "AWS_ACCESS_KEY_ID"
	| "AWS_SECRET_ACCESS_KEY"
	| "AWS_SES_FROM_EMAIL"
	| "AWS_SES_FROM_NAME"
	| "GOOGLE_CLIENT_ID"
	| "GOOGLE_CLIENT_SECRET"
	| "GOOGLE_REDIRECT_URI"
	| "GITHUB_CLIENT_ID"
	| "GITHUB_CLIENT_SECRET"
	| "GITHUB_REDIRECT_URI"
	| "API_OAUTH_REQUEST_TIMEOUT_MS"
	| "API_METRICS_ENABLED"
	| "API_METRICS_API_KEY"
	| "API_METRICS_SLOW_REQUEST_MS"
	| "API_METRICS_SLOW_OPERATION_MS"
	| "API_METRICS_CACHE_TTL_SECONDS"
	| "API_METRICS_AGGREGATION_ENABLED"
	| "API_METRICS_AGGREGATION_CRON_SCHEDULE"
	| "API_METRICS_AGGREGATION_WINDOW_MINUTES"
	| "API_METRICS_SNAPSHOT_RETENTION_COUNT";

// Replace the index signature with a constrained mapping
// Allow string indexing so tests and dynamic access are permitted
export type SetupAnswers = Partial<Record<SetupKey, string>> & {
	[key: string]: string | undefined;
};

const envFileName = ".env";
let backupCreated = false;
let cleanupInProgress = false;
let sigintHandler: (() => void | Promise<void>) | null = null;

/**
 * Restores .env file from backup if one was created during setup.
 * Guards against concurrent cleanup attempts.
 * @returns Boolean indicating restoration status:
 *   - `true` if restoration was successful
 *   - `true` if no backup was created (nothing to restore, not an error)
 *   - `false` if restoration failed (backup exists but could not be restored)
 *   - `false` if cleanup is already in progress (prevents concurrent cleanup)
 */
async function restoreBackup(): Promise<boolean> {
	// Note: There's a tiny window for a race condition between the check and set
	// of cleanupInProgress. This is acceptable for SIGINT handler cleanup as:
	// 1. SIGINT is typically a user-initiated single event
	// 2. The worst case is redundant cleanup attempts, which are safe
	// 3. The finally block ensures cleanupInProgress is always reset
	if (cleanupInProgress) {
		// Prevent multiple simultaneous cleanup attempts
		return false;
	}

	cleanupInProgress = true;

	try {
		if (!backupCreated) {
			console.log("📋 No backup was created yet, nothing to restore");
			return true; // Not an error, just nothing to do
		}

		try {
			// Validate that backup actually exists when backupCreated is true
			// This ensures state consistency: if backupCreated is true, we should have a backup
			const backupDir = ".backup";
			try {
				await fs.access(backupDir);
			} catch (err: unknown) {
				const error = err as NodeJS.ErrnoException;
				if (error.code === "ENOENT") {
					console.warn(
						"⚠️  Backup was marked as created but backup directory does not exist",
					);
					return false; // State inconsistency: backupCreated=true but no backup dir
				}
				throw err; // Re-throw other errors
			}

			await restoreLatestBackup();
			console.log("✅ Original configuration restored successfully");
			return true;
		} catch (error: unknown) {
			console.error("❌ Failed to restore backup:", error);
			console.error(
				"\n   You may need to manually restore from the .backup directory",
			);
			return false;
		}
	} finally {
		cleanupInProgress = false;
	}
}

/**
 * Test-only export to allow testing the cleanupInProgress guard
 * @internal
 */
export function __test__setCleanupInProgress(value: boolean): void {
	cleanupInProgress = value;
}

/**
 * Test-only export to allow testing restoreBackup function
 * @internal
 */
export async function __test__restoreBackup(): Promise<boolean> {
	return restoreBackup();
}

/**
 * SIGINT handler that restores backup and exits
 * Defined at module scope to allow removal before re-registration
 */
async function sigintHandlerFunction(): Promise<void> {
	console.log("\n\n⚠️  Setup interrupted by user (CTRL+C)");
	console.log("=".repeat(60));
	console.log("📋 Cleaning up and restoring previous configuration...");
	console.log(`${"=".repeat(60)}\n`);

	const restored = await restoreBackup();

	if (restored) {
		console.log(
			"\n✅ Your environment has been restored to its previous state",
		);
		console.log("   You can safely run setup again when ready\n");
		process.exit(0); // Clean exit since we restored successfully
	} else {
		console.log("\n⚠️  Cleanup incomplete - please check your .env file");
		console.log(
			"   Run setup again or restore manually from .backup directory\n",
		);
		process.exit(1); // Error exit since restoration failed
	}
}

async function restoreLatestBackup(): Promise<void> {
	const backupDir = ".backup";
	const envPrefix = ".env.";
	try {
		await fs.access(backupDir);
	} catch (err: unknown) {
		const error = err as NodeJS.ErrnoException;
		if (error.code === "ENOENT") {
			console.warn("⚠️  Backup directory .backup does not exist");
			return;
		}
		console.error("❌ Error accessing backup directory:", error);
		throw error;
	}
	try {
		const files = await fs.readdir(backupDir);
		const backupFiles = files.filter((file) => file.startsWith(envPrefix));
		if (backupFiles.length > 0) {
			const sortedBackups = backupFiles
				.map((fileName) => {
					const epochStr = fileName.substring(envPrefix.length);
					return {
						name: fileName,
						epoch: Number.parseInt(epochStr, 10),
					};
				})
				.filter((file) => !Number.isNaN(file.epoch))
				.sort((a, b) => b.epoch - a.epoch);
			const latestBackup = sortedBackups[0];
			if (latestBackup) {
				const backupPath = path.join(backupDir, latestBackup.name);
				console.log(`Restoring from latest backup: ${backupPath}`);
				// Use atomic write: write to temp file first, then rename
				// This ensures the .env file is either fully restored or unchanged
				const tempPath = ".env.tmp";
				try {
					await fs.copyFile(backupPath, tempPath);
					await fs.rename(tempPath, ".env"); // Atomic on POSIX systems
				} catch (err) {
					// Clean up temp file if it exists (e.g., if copyFile succeeded but rename failed)
					try {
						await fs.unlink(tempPath);
					} catch {
						// Ignore cleanup errors - temp file may not exist or already be removed
					}
					throw err; // Re-throw the original error after cleanup attempt
				}
			} else {
				console.warn("⚠️  No valid backup files found with epoch timestamps");
			}
		} else {
			console.warn("⚠️  No backup files found in .backup directory");
		}
	} catch (readError) {
		console.error("❌ Error reading backup directory:", readError);
		throw readError;
	}
}

export function isBooleanString(input: unknown): input is "true" | "false" {
	return typeof input === "string" && (input === "true" || input === "false");
}
export function validateRequiredFields(answers: SetupAnswers): void {
	const requiredFields: SetupKey[] = [
		"CI",
		"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
	];
	const missingFields: string[] = [];
	for (const field of requiredFields) {
		const value = answers[field];
		if (!value || value.trim() === "") {
			missingFields.push(field);
		}
	}
	if (missingFields.length > 0) {
		throw new Error(
			`Missing required configuration fields: ${missingFields.join(", ")}`,
		);
	}
}
export function validateBooleanFields(answers: SetupAnswers): void {
	const booleanFields: SetupKey[] = [
		"CI",
		"API_IS_APPLY_DRIZZLE_MIGRATIONS",
		"API_IS_GRAPHIQL",
		"API_IS_PINO_PRETTY",
		"API_MINIO_USE_SSL",
		"API_POSTGRES_SSL_MODE",
	];
	const invalidFields: string[] = [];
	for (const field of booleanFields) {
		const value = answers[field];
		if (value !== undefined && !isBooleanString(value)) {
			invalidFields.push(field);
		}
	}
	if (invalidFields.length > 0) {
		throw new Error(
			`Boolean fields must be "true" or "false": ${invalidFields.join(", ")}`,
		);
	}
}
export function validatePortNumbers(answers: SetupAnswers): void {
	const portFields: SetupKey[] = [
		"API_PORT",
		"API_MINIO_PORT",
		"API_POSTGRES_PORT",
		"CLOUDBEAVER_MAPPED_PORT",
		"MINIO_API_MAPPED_PORT",
		"MINIO_CONSOLE_MAPPED_PORT",
		"POSTGRES_MAPPED_PORT",
		"CADDY_HTTP_MAPPED_PORT",
		"CADDY_HTTPS_MAPPED_PORT",
		"CADDY_HTTP3_MAPPED_PORT",
		"CADDY_TALAWA_API_PORT",
	];
	const invalidFields: string[] = [];
	for (const field of portFields) {
		const value = answers[field];
		if (value !== undefined) {
			const port = Number.parseInt(value, 10);
			if (Number.isNaN(port) || port < 1 || port > 65535) {
				invalidFields.push(field);
			}
		}
	}
	if (invalidFields.length > 0) {
		throw new Error(
			`Port numbers must be between 1 and 65535: ${invalidFields.join(", ")}`,
		);
	}
}
export function validateSamplingRatio(input: string): true | string {
	const ratio = Number.parseFloat(input);
	if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
		return "Please enter valid sampling ratio (0-1).";
	}
	return true;
}
export function validateAllAnswers(answers: SetupAnswers): void {
	console.log("\n📋 Validating configuration...");
	validateRequiredFields(answers);
	validateBooleanFields(answers);
	validatePortNumbers(answers);
	console.log("✅ All validations passed");
}
export async function observabilitySetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.API_OTEL_ENABLED = await promptList(
			"API_OTEL_ENABLED",
			"Enable OpenTelemetry observability?",
			["true", "false"],
			"false",
		);
		if (answers.API_OTEL_ENABLED === "true") {
			answers.API_OTEL_SAMPLING_RATIO = await promptInput(
				"API_OTEL_SAMPLING_RATIO",
				"OpenTelemetry sampling ratio (0-1):",
				"1.0",
				validateSamplingRatio,
			);
		}
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}

/**
 * Sets up metrics configuration.
 * Prompts user to configure performance monitoring settings.
 * @param answers - Current setup answers object
 * @returns Updated answers object with metrics configuration
 */
export async function metricsSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		console.log("\n--- Performance Metrics Configuration ---");
		console.log("Configure performance monitoring for your API.");
		console.log();

		answers.API_METRICS_ENABLED = await promptList(
			"API_METRICS_ENABLED",
			"Enable performance metrics collection?",
			["true", "false"],
			"true",
		);

		if (answers.API_METRICS_ENABLED === "true") {
			answers.API_METRICS_API_KEY = await promptInput(
				"API_METRICS_API_KEY",
				"API key for /metrics/perf endpoint (leave empty for no auth):",
				"",
			);

			answers.API_METRICS_SLOW_REQUEST_MS = await promptInput(
				"API_METRICS_SLOW_REQUEST_MS",
				"Slow request threshold in milliseconds:",
				"500",
				(input: string) => {
					const ms = Number.parseInt(input, 10);
					if (Number.isNaN(ms) || ms < 1) {
						return "Please enter a valid positive integer.";
					}
					return true;
				},
			);

			answers.API_METRICS_SLOW_OPERATION_MS = await promptInput(
				"API_METRICS_SLOW_OPERATION_MS",
				"Slow operation threshold in milliseconds:",
				"200",
				(input: string) => {
					const ms = Number.parseInt(input, 10);
					if (Number.isNaN(ms) || ms < 1) {
						return "Please enter a valid positive integer.";
					}
					return true;
				},
			);

			answers.API_METRICS_AGGREGATION_ENABLED = await promptList(
				"API_METRICS_AGGREGATION_ENABLED",
				"Enable background metrics aggregation?",
				["true", "false"],
				"true",
			);

			if (answers.API_METRICS_AGGREGATION_ENABLED === "true") {
				answers.API_METRICS_AGGREGATION_CRON_SCHEDULE = await promptInput(
					"API_METRICS_AGGREGATION_CRON_SCHEDULE",
					"Aggregation cron schedule (default: every 5 minutes):",
					"*/5 * * * *",
				);

				answers.API_METRICS_AGGREGATION_WINDOW_MINUTES = await promptInput(
					"API_METRICS_AGGREGATION_WINDOW_MINUTES",
					"Aggregation window in minutes:",
					"5",
					(input: string) => {
						const mins = Number.parseInt(input, 10);
						if (Number.isNaN(mins) || mins < 1) {
							return "Please enter a valid positive integer.";
						}
						return true;
					},
				);

				answers.API_METRICS_CACHE_TTL_SECONDS = await promptInput(
					"API_METRICS_CACHE_TTL_SECONDS",
					"Cache TTL for aggregated metrics in seconds:",
					"300",
					(input: string) => {
						const secs = Number.parseInt(input, 10);
						if (Number.isNaN(secs) || secs < 1) {
							return "Please enter a valid positive integer.";
						}
						return true;
					},
				);
			}

			answers.API_METRICS_SNAPSHOT_RETENTION_COUNT = await promptInput(
				"API_METRICS_SNAPSHOT_RETENTION_COUNT",
				"Maximum snapshots to retain in memory:",
				"1000",
				(input: string) => {
					const count = Number.parseInt(input, 10);
					if (Number.isNaN(count) || count < 1) {
						return "Please enter a valid positive integer.";
					}
					return true;
				},
			);
		}

		console.log("\nMetrics configuration completed!");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
async function handlePromptError(err: unknown): Promise<never> {
	console.error(err);
	await restoreLatestBackup();
	process.exit(1);
}
export async function checkEnvFile(): Promise<boolean> {
	try {
		await fs.access(envFileName);
		return true;
	} catch {
		return false;
	}
}
export async function initializeEnvFile(answers: SetupAnswers): Promise<void> {
	const envFileToUse =
		answers.CI === "true" ? "envFiles/.env.ci" : "envFiles/.env.devcontainer";
	try {
		await fs.access(envFileToUse);
	} catch {
		console.warn(`⚠️ Warning: Configuration file '${envFileToUse}' is missing.`);
		throw new Error(
			`Configuration file '${envFileToUse}' is missing. Please create the file or use a different environment configuration.`,
		);
	}
	try {
		const fileContent = await fs.readFile(envFileToUse, { encoding: "utf-8" });
		const parsedEnv = dotenv.parse(fileContent);
		const safeContent = Object.entries(parsedEnv)
			.map(([key, value]) => {
				const escaped = value
					.replace(/\\/g, "\\\\")
					.replace(/"/g, '\\"')
					.replace(/\n/g, "\\n");
				return `${key}="${escaped}"`;
			})
			.join("\n");
		await fs.writeFile(envFileName, safeContent, { encoding: "utf-8" });
		dotenv.config({ path: envFileName });
		console.log(
			`✅ Environment variables loaded successfully from ${envFileToUse}`,
		);
	} catch (error) {
		console.error(
			`❌ Error: Failed to load environment file '${envFileToUse}'.`,
		);
		console.error(error instanceof Error ? error.message : error);
		throw new Error(
			"Failed to load environment file. Please check file permissions and ensure it contains valid environment variables.",
		);
	}
}
export async function setCI(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.CI = await promptList("CI", "Set CI:", ["true", "false"], "false");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function administratorEmail(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = await promptInput(
			"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			"Enter email:",
			"administrator@email.com",
			validateEmail,
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function reCaptchaSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.RECAPTCHA_SECRET_KEY = await promptInput(
			"RECAPTCHA_SECRET_KEY",
			"Enter Google reCAPTCHA v2 Secret Key:",
			"",
			(input: string) => {
				if (input.trim().length < 1) {
					return "reCAPTCHA Secret Key cannot be empty.";
				}
				return true;
			},
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}

/**
 * Sets up OAuth provider configuration.
 * Prompts user to select which providers to configure and collects credentials.
 * @param answers - Current setup answers object
 * @returns Updated answers object with OAuth configuration
 */
export async function oauthSetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		const providers = await promptList(
			"oauthProviders",
			"Which OAuth providers would you like to configure?",
			[
				"Google OAuth",
				"GitHub OAuth",
				"Both Google and GitHub",
				"Skip OAuth setup",
			],
			"Skip OAuth setup",
		);

		if (providers === "Skip OAuth setup") {
			return answers;
		}

		const setupGoogle =
			providers === "Google OAuth" || providers === "Both Google and GitHub";
		const setupGitHub =
			providers === "GitHub OAuth" || providers === "Both Google and GitHub";

		if (setupGoogle) {
			console.log("\n--- Google OAuth Configuration ---");
			console.log("Get your Google OAuth credentials from:");
			console.log("https://console.developers.google.com/apis/credentials");
			console.log("Make sure to:");
			console.log("1. Create OAuth 2.0 Client ID");
			console.log("2. Add your redirect URI to authorized redirect URIs");
			console.log();

			answers.GOOGLE_CLIENT_ID = await promptInput(
				"GOOGLE_CLIENT_ID",
				"Enter Google OAuth Client ID:",
				answers.GOOGLE_CLIENT_ID,
				(input: string) => {
					if (input.trim().length < 1) {
						return "Google Client ID cannot be empty.";
					}
					return true;
				},
			);

			answers.GOOGLE_CLIENT_SECRET = await promptInput(
				"GOOGLE_CLIENT_SECRET",
				"Enter Google OAuth Client Secret:",
				answers.GOOGLE_CLIENT_SECRET,
				(input: string) => {
					if (input.trim().length < 1) {
						return "Google Client Secret cannot be empty.";
					}
					return true;
				},
			);

			answers.GOOGLE_REDIRECT_URI = await promptInput(
				"GOOGLE_REDIRECT_URI",
				"Enter Google OAuth Redirect URI:",
				answers.GOOGLE_REDIRECT_URI ||
					"http://localhost:4000/auth/google/callback",
				(input: string) => {
					if (input.trim().length < 1) {
						return "Google Redirect URI cannot be empty.";
					}
					try {
						new URL(input.trim());
						return true;
					} catch {
						return "Please enter a valid URL.";
					}
				},
			);
		}

		if (setupGitHub) {
			console.log("\n--- GitHub OAuth Configuration ---");
			console.log("Get your GitHub OAuth credentials from:");
			console.log("https://github.com/settings/developers");
			console.log("Make sure to:");
			console.log("1. Create a new OAuth App");
			console.log("2. Set the correct Authorization callback URL");
			console.log();

			answers.GITHUB_CLIENT_ID = await promptInput(
				"GITHUB_CLIENT_ID",
				"Enter GitHub OAuth Client ID:",
				answers.GITHUB_CLIENT_ID,
				(input: string) => {
					if (input.trim().length < 1) {
						return "GitHub Client ID cannot be empty.";
					}
					return true;
				},
			);

			answers.GITHUB_CLIENT_SECRET = await promptInput(
				"GITHUB_CLIENT_SECRET",
				"Enter GitHub OAuth Client Secret:",
				answers.GITHUB_CLIENT_SECRET,
				(input: string) => {
					if (input.trim().length < 1) {
						return "GitHub Client Secret cannot be empty.";
					}
					return true;
				},
			);

			answers.GITHUB_REDIRECT_URI = await promptInput(
				"GITHUB_REDIRECT_URI",
				"Enter GitHub OAuth Redirect URI:",
				answers.GITHUB_REDIRECT_URI ||
					"http://localhost:4000/auth/github/callback",
				(input: string) => {
					if (input.trim().length < 1) {
						return "GitHub Redirect URI cannot be empty.";
					}
					try {
						new URL(input.trim());
						return true;
					} catch {
						return "Please enter a valid URL.";
					}
				},
			);
		}

		// Configure OAuth request timeout
		const useDefaultTimeout = await promptConfirm(
			"useDefaultOAuthTimeout",
			"Use recommended default OAuth request timeout settings (10 seconds)?",
			true,
		);

		if (useDefaultTimeout) {
			answers.API_OAUTH_REQUEST_TIMEOUT_MS = "10000";
		} else {
			answers.API_OAUTH_REQUEST_TIMEOUT_MS = await promptInput(
				"API_OAUTH_REQUEST_TIMEOUT_MS",
				"Enter OAuth request timeout in milliseconds:",
				answers.API_OAUTH_REQUEST_TIMEOUT_MS || "10000",
				(input: string) => {
					const timeout = Number.parseInt(input, 10);
					if (Number.isNaN(timeout) || timeout < 1000 || timeout > 60000) {
						return "Timeout must be between 1000 and 60000 milliseconds.";
					}
					return true;
				},
			);
		}

		console.log("\nOAuth provider configuration completed!");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}

export async function apiSetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.API_BASE_URL = await promptInput(
			"API_BASE_URL",
			"API base URL:",
			"http://127.0.0.1:4000",
			validateURL,
		);
		answers.API_HOST = await promptInput("API_HOST", "API host:", "0.0.0.0");
		answers.API_PORT = await promptInput(
			"API_PORT",
			"API port:",
			"4000",
			validatePort,
		);
		answers.API_IS_APPLY_DRIZZLE_MIGRATIONS = await promptList(
			"API_IS_APPLY_DRIZZLE_MIGRATIONS",
			"Apply Drizzle migrations?",
			["true", "false"],
			"true",
		);
		answers.API_IS_GRAPHIQL = await promptList(
			"API_IS_GRAPHIQL",
			"Enable GraphQL?",
			["true", "false"],
			answers.CI === "false" ? "true" : "false",
		);
		answers.API_IS_PINO_PRETTY = await promptList(
			"API_IS_PINO_PRETTY",
			"Enable Pino Pretty logs?",
			["true", "false"],
			answers.CI === "false" ? "true" : "false",
		);
		answers.API_JWT_EXPIRES_IN = await promptInput(
			"API_JWT_EXPIRES_IN",
			"JWT expiration (ms):",
			"2592000000",
		);
		const jwtSecret = generateJwtSecret();
		answers.API_JWT_SECRET = await promptInput(
			"API_JWT_SECRET",
			"JWT secret:",
			jwtSecret,
			(input: string) => {
				const trimmed = input.trim();
				if (trimmed.length < 128) {
					return "JWT secret must be at least 128 characters long.";
				}
				return true;
			},
		);

		answers.API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS = await promptInput(
			"API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS",
			"Email verification token expiration (seconds):",
			"86400",
			(input: string) => {
				const seconds = Number.parseInt(input, 10);
				if (Number.isNaN(seconds) || seconds < 60) {
					return "Expiration must be at least 60 seconds.";
				}
				return true;
			},
		);

		const emailVerificationSecret = generateJwtSecret();
		answers.API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET = await promptInput(
			"API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET",
			"Email verification HMAC secret:",
			emailVerificationSecret,
			(input: string) => {
				const trimmed = input.trim();
				if (trimmed.length < 32) {
					return "HMAC secret must be at least 32 characters long.";
				}
				return true;
			},
		);

		answers.API_LOG_LEVEL = await promptList(
			"API_LOG_LEVEL",
			"Log level:",
			["info", "debug"],
			answers.CI === "true" ? "info" : "debug",
		);
		answers.API_MINIO_ACCESS_KEY = await promptInput(
			"API_MINIO_ACCESS_KEY",
			"Minio access key:",
			"talawa",
		);
		answers.API_MINIO_END_POINT = await promptInput(
			"API_MINIO_END_POINT",
			"Minio endpoint:",
			"minio",
		);
		answers.API_MINIO_PORT = await promptInput(
			"API_MINIO_PORT",
			"Minio port:",
			"9000",
		);
		const existingMinioPassword =
			answers.MINIO_ROOT_PASSWORD ?? process.env.MINIO_ROOT_PASSWORD;
		answers.API_MINIO_SECRET_KEY = await promptInput(
			"API_MINIO_SECRET_KEY",
			"Minio secret key:",
			existingMinioPassword ?? "password",
		);
		if (existingMinioPassword !== undefined) {
			// Configured password found (including empty string), validate against it
			const minioPassword = existingMinioPassword;
			while (answers.API_MINIO_SECRET_KEY !== minioPassword) {
				console.warn("⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD.");
				answers.API_MINIO_SECRET_KEY = await promptInput(
					"API_MINIO_SECRET_KEY",
					"Minio secret key:",
					minioPassword, // Use configured password as default
				);
			}
			console.log("✅ API_MINIO_SECRET_KEY matches MINIO_ROOT_PASSWORD");
		} else {
			// No configured value: set both answers.MINIO_ROOT_PASSWORD and
			// process.env.MINIO_ROOT_PASSWORD to answers.API_MINIO_SECRET_KEY
			// so the chosen API_MINIO_SECRET_KEY becomes the stored Minio password
			answers.MINIO_ROOT_PASSWORD = answers.API_MINIO_SECRET_KEY;
			process.env.MINIO_ROOT_PASSWORD = answers.API_MINIO_SECRET_KEY;
			console.log(
				"ℹ️  MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
			);
		}
		answers.API_MINIO_TEST_END_POINT = await promptInput(
			"API_MINIO_TEST_END_POINT",
			"Minio test endpoint:",
			"minio-test",
		);
		answers.API_MINIO_USE_SSL = await promptList(
			"API_MINIO_USE_SSL",
			"Use Minio SSL?",
			["true", "false"],
			"false",
		);
		answers.API_POSTGRES_DATABASE = await promptInput(
			"API_POSTGRES_DATABASE",
			"Postgres database:",
			"talawa",
		);
		answers.API_POSTGRES_HOST = await promptInput(
			"API_POSTGRES_HOST",
			"Postgres host:",
			"postgres",
		);
		const postgresPassword =
			answers.POSTGRES_PASSWORD ?? process.env.POSTGRES_PASSWORD;
		answers.API_POSTGRES_PASSWORD = await promptInput(
			"API_POSTGRES_PASSWORD",
			"Postgres password:",
			postgresPassword ?? "password",
		);
		if (postgresPassword !== undefined) {
			// Configured password found (including empty string), validate against it
			const postgresPasswordLocal = postgresPassword;
			while (answers.API_POSTGRES_PASSWORD !== postgresPasswordLocal) {
				console.warn("⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD.");
				answers.API_POSTGRES_PASSWORD = await promptInput(
					"API_POSTGRES_PASSWORD",
					"Postgres password:",
					postgresPasswordLocal, // Use configured password as default
				);
			}
			console.log("✅ API_POSTGRES_PASSWORD matches POSTGRES_PASSWORD");
		} else {
			// No configured value: set both answers.POSTGRES_PASSWORD and
			// process.env.POSTGRES_PASSWORD to answers.API_POSTGRES_PASSWORD
			// so the chosen API_POSTGRES_PASSWORD becomes the stored Postgres password
			answers.POSTGRES_PASSWORD = answers.API_POSTGRES_PASSWORD;
			process.env.POSTGRES_PASSWORD = answers.API_POSTGRES_PASSWORD;
			console.log(
				"ℹ️  POSTGRES_PASSWORD will be set to match API_POSTGRES_PASSWORD",
			);
		}
		answers.API_POSTGRES_PORT = await promptInput(
			"API_POSTGRES_PORT",
			"Postgres port:",
			"5432",
		);
		answers.API_POSTGRES_SSL_MODE = await promptList(
			"API_POSTGRES_SSL_MODE",
			"Use Postgres SSL?",
			["true", "false"],
			"false",
		);
		answers.API_POSTGRES_TEST_HOST = await promptInput(
			"API_POSTGRES_TEST_HOST",
			"Postgres test host:",
			"postgres-test",
		);
		answers.API_POSTGRES_USER = await promptInput(
			"API_POSTGRES_USER",
			"Postgres user:",
			"talawa",
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function cloudbeaverSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.CLOUDBEAVER_ADMIN_NAME = await promptInput(
			"CLOUDBEAVER_ADMIN_NAME",
			"CloudBeaver admin name:",
			"talawa",
			validateCloudBeaverAdmin,
		);
		answers.CLOUDBEAVER_ADMIN_PASSWORD = await promptInput(
			"CLOUDBEAVER_ADMIN_PASSWORD",
			"CloudBeaver admin password:",
			"password",
			validateCloudBeaverPassword,
		);
		answers.CLOUDBEAVER_MAPPED_HOST_IP = await promptInput(
			"CLOUDBEAVER_MAPPED_HOST_IP",
			"CloudBeaver mapped host IP:",
			"127.0.0.1",
		);
		answers.CLOUDBEAVER_MAPPED_PORT = await promptInput(
			"CLOUDBEAVER_MAPPED_PORT",
			"CloudBeaver mapped port:",
			"8978",
			validatePort,
		);
		answers.CLOUDBEAVER_SERVER_NAME = await promptInput(
			"CLOUDBEAVER_SERVER_NAME",
			"CloudBeaver server name:",
			"Talawa CloudBeaver Server",
		);
		answers.CLOUDBEAVER_SERVER_URL = await promptInput(
			"CLOUDBEAVER_SERVER_URL",
			"CloudBeaver server URL:",
			"http://127.0.0.1:8978",
			validateCloudBeaverURL,
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function minioSetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.MINIO_BROWSER = await promptInput(
			"MINIO_BROWSER",
			"Minio browser (on/off):",
			answers.CI === "true" ? "off" : "on",
		);
		if (answers.CI === "false") {
			answers.MINIO_API_MAPPED_HOST_IP = await promptInput(
				"MINIO_API_MAPPED_HOST_IP",
				"Minio API mapped host IP:",
				"127.0.0.1",
			);
			answers.MINIO_API_MAPPED_PORT = await promptInput(
				"MINIO_API_MAPPED_PORT",
				"Minio API mapped port:",
				"9000",
				validatePort,
			);
			answers.MINIO_CONSOLE_MAPPED_HOST_IP = await promptInput(
				"MINIO_CONSOLE_MAPPED_HOST_IP",
				"Minio console mapped host IP:",
				"127.0.0.1",
			);
			answers.MINIO_CONSOLE_MAPPED_PORT = await promptInput(
				"MINIO_CONSOLE_MAPPED_PORT",
				"Minio console mapped port:",
				"9001",
				validatePort,
			);
			let portConflict = true;
			while (portConflict && answers.CI === "false") {
				if (
					answers.MINIO_API_MAPPED_PORT === answers.MINIO_CONSOLE_MAPPED_PORT
				) {
					console.warn(
						"⚠️ Port conflict detected: MinIO API and Console ports must be different.",
					);
					answers.MINIO_CONSOLE_MAPPED_PORT = await promptInput(
						"MINIO_CONSOLE_MAPPED_PORT",
						"Please enter a different Minio console mapped port:",
						String(Number(answers.MINIO_API_MAPPED_PORT) + 1),
						validatePort,
					);
				} else {
					portConflict = false;
				}
			}
		}
		answers.MINIO_ROOT_PASSWORD = await promptInput(
			"MINIO_ROOT_PASSWORD",
			"Minio root password:",
			"password",
		);
		answers.MINIO_ROOT_USER = await promptInput(
			"MINIO_ROOT_USER",
			"Minio root user:",
			"talawa",
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function postgresSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.POSTGRES_DB = await promptInput(
			"POSTGRES_DB",
			"Postgres database:",
			"talawa",
		);
		if (answers.CI === "false") {
			answers.POSTGRES_MAPPED_HOST_IP = await promptInput(
				"POSTGRES_MAPPED_HOST_IP",
				"Postgres mapped host IP:",
				"127.0.0.1",
			);
			answers.POSTGRES_MAPPED_PORT = await promptInput(
				"POSTGRES_MAPPED_PORT",
				"Postgres mapped port:",
				"5432",
				validatePort,
			);
		}
		answers.POSTGRES_PASSWORD = await promptInput(
			"POSTGRES_PASSWORD",
			"Postgres password:",
			"password",
		);
		answers.POSTGRES_USER = await promptInput(
			"POSTGRES_USER",
			"Postgres user:",
			"talawa",
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function caddySetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.CADDY_HTTP_MAPPED_PORT = await promptInput(
			"CADDY_HTTP_MAPPED_PORT",
			"Caddy HTTP mapped port:",
			"80",
			validatePort,
		);
		answers.CADDY_HTTPS_MAPPED_PORT = await promptInput(
			"CADDY_HTTPS_MAPPED_PORT",
			"Caddy HTTPS mapped port:",
			"443",
			validatePort,
		);
		answers.CADDY_HTTP3_MAPPED_PORT = await promptInput(
			"CADDY_HTTP3_MAPPED_PORT",
			"Caddy HTTP3 mapped port:",
			"443",
			validatePort,
		);
		answers.CADDY_TALAWA_API_DOMAIN_NAME = await promptInput(
			"CADDY_TALAWA_API_DOMAIN_NAME",
			"Caddy Talawa API domain name:",
			"localhost",
		);
		answers.CADDY_TALAWA_API_EMAIL = await promptInput(
			"CADDY_TALAWA_API_EMAIL",
			"Caddy Talawa API email:",
			"talawa@email.com",
			validateEmail,
		);
		answers.CADDY_TALAWA_API_HOST = await promptInput(
			"CADDY_TALAWA_API_HOST",
			"Caddy Talawa API host:",
			"api",
		);
		answers.CADDY_TALAWA_API_PORT = await promptInput(
			"CADDY_TALAWA_API_PORT",
			"Caddy Talawa API port:",
			"4000",
			validatePort,
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}

export async function setup(): Promise<SetupAnswers> {
	// Reset state variables at the start of each setup call
	// This ensures clean state for tests and multiple setup() calls
	backupCreated = false;
	cleanupInProgress = false;

	const initialCI = process.env.CI;
	let answers: SetupAnswers = {};
	if (await checkEnvFile()) {
		const envReconfigure = await promptConfirm(
			"envReconfigure",
			"Env file found. Re-configure?",
			true,
		);
		if (!envReconfigure) {
			process.exit(0);
		}
	}
	dotenv.config({ path: envFileName });

	// Remove previous SIGINT handler if one exists to prevent accumulation
	if (sigintHandler) {
		process.removeListener("SIGINT", sigintHandler);
	}

	// Register the SIGINT handler
	sigintHandler = sigintHandlerFunction;
	process.once("SIGINT", sigintHandler);
	if (await checkEnvFile()) {
		const isInteractive =
			initialCI !== "true" && process.stdin && process.stdin.isTTY;
		let shouldBackup = true;
		if (isInteractive) {
			try {
				shouldBackup = await promptConfirm(
					"shouldBackup",
					"Would you like to back up the current .env file before setup modifies it?",
					true,
				);
			} catch (err) {
				if (process.env.NODE_ENV === "production" || initialCI === "true") {
					console.error("Prompt failed (fatal):", err);
					process.exit(1);
				}
				throw err;
			}
		} else {
			shouldBackup = process.env.TALAWA_SKIP_ENV_BACKUP !== "true";
		}
		try {
			backupCreated = await envFileBackup(shouldBackup);
		} catch (err) {
			if (process.env.NODE_ENV === "production" || initialCI === "true") {
				console.error("envFileBackup failed (fatal):", err);
				process.exit(1);
			}
			throw err;
		}
	}
	answers = await setCI(answers);
	await initializeEnvFile(answers);
	const useDefaultApi = await promptConfirm(
		"useDefaultApi",
		"Use recommended default API settings?",
		true,
	);
	if (!useDefaultApi) {
		answers = await apiSetup(answers);
	}
	const useDefaultMinio = await promptConfirm(
		"useDefaultMinio",
		"Use recommended default Minio settings?",
		true,
	);
	if (!useDefaultMinio) {
		answers = await minioSetup(answers);
	}
	if (answers.CI === "false") {
		const useDefaultCloudbeaver = await promptConfirm(
			"useDefaultCloudbeaver",
			"Use recommended default CloudBeaver settings?",
			true,
		);
		if (!useDefaultCloudbeaver) {
			answers = await cloudbeaverSetup(answers);
		}
	}
	const useDefaultPostgres = await promptConfirm(
		"useDefaultPostgres",
		"Use recommended default Postgres settings?",
		true,
	);
	if (!useDefaultPostgres) {
		answers = await postgresSetup(answers);
	}
	const useDefaultCaddy = await promptConfirm(
		"useDefaultCaddy",
		"Use recommended default Caddy settings?",
		true,
	);
	if (!useDefaultCaddy) {
		answers = await caddySetup(answers);
	}
	answers = await administratorEmail(answers);
	const setupReCaptcha = await promptConfirm(
		"setupReCaptcha",
		"Do you want to set up Google reCAPTCHA v2 now?",
		false,
	);
	if (setupReCaptcha) {
		answers = await reCaptchaSetup(answers);
	}
	answers = await emailSetup(answers);
	const setupOAuth = await promptConfirm(
		"setupOAuth",
		"Do you want to set up OAuth providers now?",
		false,
	);
	if (setupOAuth) {
		answers = await oauthSetup(answers);
	}
	const setupMetrics = await promptConfirm(
		"setupMetrics",
		"Do you want to configure performance metrics settings now?",
		false,
	);
	if (setupMetrics) {
		answers = await metricsSetup(answers);
	}
	await updateEnvVariable(answers);
	console.log("Configuration complete.");
	return answers;
}
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	setup().catch((err) => {
		console.error("Setup failed:", err);
		process.exit(1);
	});
}
