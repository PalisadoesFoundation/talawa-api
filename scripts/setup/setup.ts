import { promises as fs } from "node:fs";
import path, { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL, URL } from "node:url";
import dotenv from "dotenv";
import { emailSetup } from "./emailSetup";
import { envFileBackup } from "./envFileBackup/envFileBackup";
import { promptConfirm, promptInput, promptList } from "./promptHelpers";
import { administratorEmail } from "./services/administratorSetup";
import { apiSetup } from "./services/apiSetup";
import { caddySetup } from "./services/caddySetup";
import { setCI } from "./services/ciSetup";
import { cloudbeaverSetup } from "./services/cloudbeaverSetup";
import { minioSetup } from "./services/minioSetup";
import { observabilitySetup } from "./services/observabilitySetup";
import { postgresSetup } from "./services/postgresSetup";
import type { SetupAnswers } from "./types";
import { updateEnvVariable } from "./updateEnvVariable";

const envFileName = ".env";
let backupCreated = false;
let cleanupInProgress = false;
let sigintHandler: (() => void | Promise<void>) | null = null;

async function restoreBackup(): Promise<boolean> {
	// Atomic check-and-set to prevent race condition.
	// This relies on JavaScript's single-threaded execution model:
	// no await between check and set means no task interleaving.
	if (cleanupInProgress) {
		return false;
	}
	cleanupInProgress = true;

	try {
		if (!backupCreated) {
			console.log("📋 No backup was created yet, nothing to restore");
			return true;
		}

		try {
			const backupDir = ".backup";
			try {
				await fs.access(backupDir);
			} catch (err: unknown) {
				const error = err as NodeJS.ErrnoException;
				if (error.code === "ENOENT") {
					console.warn(
						"⚠️  Backup was marked as created but backup directory does not exist",
					);
					return false;
				}
				throw err;
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

export function __test__setCleanupInProgress(value: boolean): void {
	cleanupInProgress = value;
}

export async function __test__restoreBackup(): Promise<boolean> {
	return restoreBackup();
}

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
		process.exit(0);
	} else {
		console.log("\n⚠️  Cleanup incomplete - please check your .env file");
		console.log(
			"   Run setup again or restore manually from .backup directory\n",
		);
		process.exit(1);
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
				const tempPath = ".env.tmp";
				try {
					await fs.copyFile(backupPath, tempPath);
					await fs.rename(tempPath, ".env");
				} catch (err) {
					try {
						await fs.unlink(tempPath);
					} catch {}
					throw err;
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

async function handlePromptError(err: unknown): Promise<never> {
	console.error(err);
	await restoreBackup();
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

	if (sigintHandler) {
		process.removeListener("SIGINT", sigintHandler);
	}

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
	const setupObservability = await promptConfirm(
		"setupObservability",
		"Do you want to configure observability settings (OpenTelemetry & Metrics) now?",
		false,
	);
	if (setupObservability) {
		try {
			answers = await observabilitySetup(answers);
		} catch (err) {
			await handlePromptError(err);
		}
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
