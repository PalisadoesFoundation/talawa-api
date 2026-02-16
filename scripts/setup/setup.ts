import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import {
	restoreBackup as atomicRestoreBackup,
	cleanupTemp,
	ensureBackup,
} from "./AtomicEnvWriter";
import { emailSetup } from "./emailSetup";
import {
	checkEnvFile as checkEnvFileInternal,
	initializeEnvFile as initializeEnvFileInternal,
} from "./envFileManager";
import { promptConfirm, promptInput, promptList } from "./promptHelpers";
import { administratorEmail } from "./services/administratorSetup";
import {
	backupState,
	envBackupFile,
	envFileName,
	envTempFile,
	handlePromptError,
	type SetupAnswers,
	type SetupKey,
} from "./services/sharedSetup";

export {
	backupState,
	envBackupFile,
	envFileName,
	envTempFile,
	handlePromptError,
	type SetupAnswers,
	type SetupKey,
} from "./services/sharedSetup";
export { administratorEmail };

import { apiSetup } from "./services/apiSetup";
export { apiSetup };

import { caddySetup } from "./services/caddySetup";
export { caddySetup };

import { setCI } from "./services/ciSetup";
export { setCI };

import { cloudbeaverSetup } from "./services/cloudbeaverSetup";
export { cloudbeaverSetup };

import { minioSetup } from "./services/minioSetup";
export { minioSetup };

import { postgresSetup } from "./services/postgresSetup";
export { postgresSetup };

import { updateEnvVariable } from "./updateEnvVariable";
import { validatePositiveInteger } from "./validators";

// Re-export validators for backward compatibility
export {
	generateJwtSecret,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validateEmail,
	validatePort,
	validatePositiveInteger,
	validateURL,
} from "./validators";

let cleaningUp = false;
let exitCalled = false;

/**
 * Graceful cleanup handler for interruptions (SIGINT/SIGTERM).
 * Uses AtomicEnvWriter to clean up temp files and restore backups.
 * Idempotent - safe to call multiple times.
 * @internal Exported for testing purposes
 */
export async function gracefulCleanup(signal?: string): Promise<void> {
	// Atomic check-and-set to prevent race conditions
	if (cleaningUp) {
		return; // Already cleaning up, exit silently
	}
	cleaningUp = true;

	console.log(
		signal === undefined
			? "\n\n⚠️  Setup interrupted by user (CTRL+C)"
			: `\n\n⚠️  Setup interrupted by signal ${signal}. Cleaning up...`,
	);

	try {
		// Clean up temporary file
		try {
			await cleanupTemp(envTempFile);
		} catch (tempErr) {
			console.warn("⚠️  Failed to clean temp file:", tempErr);
			// Continue to restore backup
		}

		// Restore backup if one was created
		if (backupState.created) {
			await atomicRestoreBackup(envFileName, envBackupFile);
			console.log("✅ Original configuration restored successfully");
		} else {
			console.log("✓ Cleanup complete. No backup to restore.");
		}

		if (!exitCalled) {
			exitCalled = true;
			process.exit(0);
		}
	} catch (e) {
		console.error("✗ Cleanup encountered errors:", e);
		if (!exitCalled) {
			exitCalled = true;
			process.exit(1);
		}
	}
}

/**
 * Reset internal state for testing purposes.
 * @internal Only for use in unit tests
 */
export function resetCleanupState(options?: {
	backupCreated?: boolean;
	cleaning?: boolean;
}): void {
	backupState.created = options?.backupCreated ?? false;
	cleaningUp = options?.cleaning ?? false;
	exitCalled = false;
}

// Signal handlers will be registered in setup() to avoid test pollution

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
		console.log("\n--- OpenTelemetry Observability Configuration ---");
		console.log("Configure distributed tracing and metrics for your API.");
		console.log();

		answers.API_OTEL_ENABLED = await promptList(
			"API_OTEL_ENABLED",
			"Enable OpenTelemetry observability?",
			["true", "false"],
			"false",
		);

		if (answers.API_OTEL_ENABLED === "true") {
			answers.API_OTEL_SERVICE_NAME = await promptInput(
				"API_OTEL_SERVICE_NAME",
				"OpenTelemetry service name:",
				"talawa-api",
				(input: string) => {
					if (input.trim().length < 1) {
						return "Service name cannot be empty.";
					}
					return true;
				},
			);

			answers.API_OTEL_SAMPLING_RATIO = await promptInput(
				"API_OTEL_SAMPLING_RATIO",
				"OpenTelemetry sampling ratio (0-1):",
				"1",
				validateSamplingRatio,
			);

			answers.API_OTEL_EXPORTER_ENABLED = await promptList(
				"API_OTEL_EXPORTER_ENABLED",
				"Enable OpenTelemetry exporter?",
				["true", "false"],
				"true",
			);

			if (answers.API_OTEL_EXPORTER_ENABLED === "true") {
				answers.API_OTEL_EXPORTER_TYPE = await promptList(
					"API_OTEL_EXPORTER_TYPE",
					"Select exporter type:",
					["console", "otlp"],
					"console",
				);

				if (answers.API_OTEL_EXPORTER_TYPE === "otlp") {
					console.log("\n--- OTLP Exporter Configuration ---");
					console.log(
						"Configure endpoints for traces and metrics export to OTLP receivers.",
					);
					console.log(
						"Common examples: http://localhost:4318/v1/traces or http://otel-collector:4318/v1/traces",
					);
					console.log();

					// Trace Exporter Endpoint
					answers.API_OTEL_TRACE_EXPORTER_ENDPOINT = await promptInput(
						"API_OTEL_TRACE_EXPORTER_ENDPOINT",
						"OTLP trace exporter endpoint URL:",
						"",
						(input: string) => {
							try {
								new URL(input.trim());
								return true;
							} catch {
								return "Please enter a valid URL (e.g., http://localhost:4318/v1/traces).";
							}
						},
					);

					// Metric Exporter Endpoint
					answers.API_OTEL_METRIC_EXPORTER_ENDPOINT = await promptInput(
						"API_OTEL_METRIC_EXPORTER_ENDPOINT",
						"OTLP metric exporter endpoint URL:",
						"",
						(input: string) => {
							try {
								new URL(input.trim());
								return true;
							} catch {
								return "Please enter a valid URL (e.g., http://localhost:4318/v1/metrics).";
							}
						},
					);
				} else {
					// Console exporter - set empty endpoints
					answers.API_OTEL_TRACE_EXPORTER_ENDPOINT = "";
					answers.API_OTEL_METRIC_EXPORTER_ENDPOINT = "";
				}
			}

			console.log("\nOpenTelemetry observability configuration completed!");
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
			const apiKeyInput = await promptInput(
				"API_METRICS_API_KEY",
				"API key for /metrics/perf endpoint (leave empty for no auth):",
				"",
			);
			// Normalize empty string to undefined so schema treats it as truly optional
			answers.API_METRICS_API_KEY = apiKeyInput.trim() || undefined;

			answers.API_METRICS_SLOW_REQUEST_MS = await promptInput(
				"API_METRICS_SLOW_REQUEST_MS",
				"Slow request threshold in milliseconds:",
				"500",
				validatePositiveInteger,
			);

			answers.API_METRICS_SLOW_OPERATION_MS = await promptInput(
				"API_METRICS_SLOW_OPERATION_MS",
				"Slow operation threshold in milliseconds:",
				"200",
				validatePositiveInteger,
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
					validatePositiveInteger,
				);

				answers.API_METRICS_CACHE_TTL_SECONDS = await promptInput(
					"API_METRICS_CACHE_TTL_SECONDS",
					"Cache TTL for aggregated metrics in seconds:",
					"300",
					validatePositiveInteger,
				);
			}

			answers.API_METRICS_SNAPSHOT_RETENTION_COUNT = await promptInput(
				"API_METRICS_SNAPSHOT_RETENTION_COUNT",
				"Maximum snapshots to retain in memory:",
				"1000",
				validatePositiveInteger,
			);
		}

		console.log("\nMetrics configuration completed!");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
export async function checkEnvFile(): Promise<boolean> {
	return checkEnvFileInternal(envFileName);
}
export async function initializeEnvFile(answers: SetupAnswers): Promise<void> {
	const envFileToUse =
		answers.CI === "true" ? "envFiles/.env.ci" : "envFiles/.env.devcontainer";
	try {
		await initializeEnvFileInternal({
			ci: answers.CI === "true",
			envFile: envFileName,
			backupFile: envBackupFile,
			tempFile: envTempFile,
			templateCiFile: "envFiles/.env.ci",
			templateDevcontainerFile: "envFiles/.env.devcontainer",
			restoreFromBackup: backupState.created,
		});
		console.log(
			`✅ Environment variables loaded successfully from ${envFileToUse}`,
		);
	} catch (error) {
		console.error(
			`❌ Error: Failed to load environment file '${envFileToUse}'.`,
		);
		console.error(error instanceof Error ? error.message : error);
		throw error;
	}
}
// The implementations for setup functions like setCI, apiSetup, etc.,
// have been moved to their respective service modules in scripts/setup/services/.
// Only their exports remain here for backward compatibility.

export async function reCaptchaSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.RECAPTCHA_SECRET_KEY = await promptInput(
			"RECAPTCHA_SECRET_KEY",
			"Enter Google reCAPTCHA v3 Secret Key:",
			"",
			(input: string) => {
				if (input.trim().length < 1) {
					return "reCAPTCHA Secret Key cannot be empty.";
				}
				return true;
			},
		);

		// Configure score threshold for reCAPTCHA v3
		answers.RECAPTCHA_SCORE_THRESHOLD = await promptInput(
			"RECAPTCHA_SCORE_THRESHOLD",
			"Enter reCAPTCHA v3 score threshold (0.0-1.0, higher = more human-like, default: 0.5):",
			"0.5",
			(input: string) => {
				const score = parseFloat(input.trim());
				if (Number.isNaN(score)) {
					return "Score threshold must be a valid number.";
				}
				if (score < 0.0 || score > 1.0) {
					return "Score threshold must be between 0.0 and 1.0.";
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

export async function setup(): Promise<SetupAnswers> {
	// Reset state variables at the start of each setup call
	// This ensures clean state for tests and multiple setup() calls
	backupState.created = false;
	cleaningUp = false;
	exitCalled = false;

	// Register signal handlers for graceful cleanup
	const sigintHandler = () => gracefulCleanup("SIGINT");
	const sigtermHandler = () => gracefulCleanup("SIGTERM");
	process.on("SIGINT", sigintHandler);
	process.on("SIGTERM", sigtermHandler);

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

	// Create backup using AtomicEnvWriter if .env exists
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
		if (shouldBackup) {
			try {
				await ensureBackup(envFileName, envBackupFile);
				backupState.created = true;
			} catch (err) {
				if (process.env.NODE_ENV === "production" || initialCI === "true") {
					console.error("Backup creation failed (fatal):", err);
					process.exit(1);
				}
				throw err;
			}
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
		"Do you want to set up Google reCAPTCHA v3 now?",
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
	const setupObservability = await promptConfirm(
		"setupObservability",
		"Do you want to configure OpenTelemetry observability now?",
		false,
	);

	if (setupObservability) {
		answers = await observabilitySetup(answers);
	}
	const setupMetrics = await promptConfirm(
		"setupMetrics",
		"Do you want to configure performance metrics settings now?",
		false,
	);
	if (setupMetrics) {
		answers = await metricsSetup(answers);
	}
	await updateEnvVariable(answers, {
		envFile: envFileName,
		backupFile: envBackupFile,
		tempFile: envTempFile,
		createBackup: false,
		restoreFromBackup: backupState.created,
	});
	console.log("Configuration complete.");

	// Cleanup: Unregister signal handlers after successful setup
	process.removeListener("SIGINT", sigintHandler);
	process.removeListener("SIGTERM", sigtermHandler);

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
