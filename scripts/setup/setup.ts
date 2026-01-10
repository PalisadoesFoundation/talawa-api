import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path, { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { envFileBackup } from "./envFileBackup/envFileBackup";
import { updateEnvVariable } from "./updateEnvVariable";

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
	| "API_OTEL_SAMPLING_RATIO";

// Replace the index signature with a constrained mapping
// Allow string indexing so tests and dynamic access are permitted
export type SetupAnswers = Partial<Record<SetupKey, string>> & {
	[key: string]: string | undefined;
};

async function promptInput(
	name: string,
	message: string,
	defaultValue?: string,
	validate?: (input: string) => true | string,
): Promise<string> {
	const { [name]: result } = await inquirer.prompt([
		{ type: "input", name, message, default: defaultValue, validate },
	]);
	return result;
}
async function promptList(
	name: string,
	message: string,
	choices: string[],
	defaultValue?: string,
): Promise<string> {
	const { [name]: result } = await inquirer.prompt([
		{ type: "list", name, message, choices, default: defaultValue },
	]);
	return result;
}
async function promptConfirm(
	name: string,
	message: string,
	defaultValue?: boolean,
): Promise<boolean> {
	const { [name]: result } = await inquirer.prompt([
		{ type: "confirm", name, message, default: defaultValue },
	]);
	return result;
}
const envFileName = ".env";
async function restoreLatestBackup(): Promise<void> {
	const backupDir = ".backup";
	const envPrefix = ".env.";
	try {
		await fs.access(backupDir);
	} catch (err: unknown) {
		const error = err as NodeJS.ErrnoException;
		if (error.code === "ENOENT") {
			console.warn("Backup directory .backup does not exist");
			return;
		}
		console.error("Error accessing backup directory:", error);
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
				await fs.copyFile(backupPath, ".env");
			} else {
				console.warn("No valid backup files found with epoch timestamps");
			}
		} else {
			console.warn("No backup files found in .backup directory");
		}
	} catch (readError) {
		console.error("Error reading backup directory:", readError);
		throw readError;
	}
}
export function generateJwtSecret(): string {
	try {
		return crypto.randomBytes(64).toString("hex");
	} catch (err) {
		console.error(
			"⚠️ Warning: Permission denied while generating JWT secret. Ensure the process has sufficient filesystem access.",
			err,
		);
		throw new Error("Failed to generate JWT secret");
	}
}
export function validateURL(input: string): true | string {
	try {
		const url = new URL(input);
		const protocol = url.protocol.toLowerCase();
		if (protocol !== "http:" && protocol !== "https:") {
			return "Please enter a valid URL with http:// or https:// protocol.";
		}
		return true;
	} catch (_error) {
		return "Please enter a valid URL.";
	}
}
export function validatePort(input: string): true | string {
	const portNumber = Number(input);
	if (Number.isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
		return "Please enter a valid port number (1-65535).";
	}
	return true;
}
export function validateEmail(input: string): true | string {
	if (!input.trim()) {
		return "Email cannot be empty.";
	}
	if (input.length > 254) {
		return "Email is too long.";
	}
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(input)) {
		return "Invalid email format. Please enter a valid email address.";
	}
	return true;
}
export function validateCloudBeaverAdmin(input: string): true | string {
	if (!input) return "Admin name is required";
	if (input.length < 3) return "Admin name must be at least 3 characters long";
	if (!/^[a-zA-Z0-9_]+$/.test(input))
		return "Admin name can only contain letters, numbers, and underscores";
	return true;
}
export function validateCloudBeaverPassword(input: string): true | string {
	if (!input) return "Password is required";
	if (input.length < 8) return "Password must be at least 8 characters long";
	if (!/[A-Za-z]/.test(input) || !/[0-9]/.test(input)) {
		return "Password must contain both letters and numbers";
	}
	return true;
}
export function validateCloudBeaverURL(input: string): true | string {
	if (!input) return "Server URL is required";
	try {
		const url = new URL(input);
		if (!["http:", "https:"].includes(url.protocol)) {
			return "URL must use HTTP or HTTPS protocol";
		}
		const port = url.port || (url.protocol === "https:" ? "443" : "80");
		if (!/^\d+$/.test(port) || Number.parseInt(port, 10) > 65535) {
			return "Invalid port in URL";
		}
		return true;
	} catch {
		return "Invalid URL format";
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
		answers.API_MINIO_SECRET_KEY = await promptInput(
			"API_MINIO_SECRET_KEY",
			"Minio secret key:",
			"password",
		);
		while (answers.API_MINIO_SECRET_KEY !== process.env.MINIO_ROOT_PASSWORD) {
			console.warn("⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD.");
			answers.API_MINIO_SECRET_KEY = await promptInput(
				"API_MINIO_SECRET_KEY",
				"Minio secret key:",
				"password",
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
		answers.API_POSTGRES_PASSWORD = await promptInput(
			"API_POSTGRES_PASSWORD",
			"Postgres password:",
			"password",
		);
		while (answers.API_POSTGRES_PASSWORD !== process.env.POSTGRES_PASSWORD) {
			console.warn("⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD.");
			answers.API_POSTGRES_PASSWORD = await promptInput(
				"API_POSTGRES_PASSWORD",
				"Postgres password:",
				"password",
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
	process.once("SIGINT", async () => {
		console.log("\nProcess interrupted! Undoing changes...");
		answers = {};
		await restoreLatestBackup();
		process.exit(1);
	});
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
			await envFileBackup(shouldBackup);
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
	const useDefaultApi = await promptConfirm(
		"useDefaultApi",
		"Use recommended default API settings?",
		true,
	);
	if (!useDefaultApi) {
		answers = await apiSetup(answers);
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
