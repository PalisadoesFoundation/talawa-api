import crypto from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { updateEnvVariable } from "./updateEnvVariable";

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

let answers: Record<string, string> = {};
const envFileName = ".env";

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
		new URL(input);
		return true;
	} catch {
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

export function checkEnvFile(): boolean {
	return fs.existsSync(envFileName);
}

export function initializeEnvFile(): void {
	if (fs.existsSync(envFileName)) {
		fs.copyFileSync(envFileName, `${envFileName}.backup`);
		console.log(`✅ Backup created at ${envFileName}.backup`);
	}

	const envFileToUse =
		answers.CI === "true" ? "envFiles/.env.ci" : "envFiles/.env.devcontainer";

	if (!fs.existsSync(envFileToUse)) {
		console.warn(`⚠️ Warning: Configuration file '${envFileToUse}' is missing.`);
		console.log(
			"Please create the file or use a different environment configuration.",
		);
		return;
	}

	try {
		const parsedEnv = dotenv.parse(fs.readFileSync(envFileToUse));
		dotenv.config({ path: envFileName });

		const safeContent = Object.entries(parsedEnv)
			.map(([key, value]) => {
				const safeValue = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
				return `${key}="${safeValue}"`;
			})
			.join("\n");

		fs.writeFileSync(envFileName, safeContent, { encoding: "utf-8" });
		console.log(
			`✅ Environment variables loaded successfully from ${envFileToUse}`,
		);
	} catch (error) {
		console.error(
			`❌ Error: Failed to load environment file '${envFileToUse}'.`,
		);
		console.error(error instanceof Error ? error.message : error);
		console.log(
			"Please check the file permissions and ensure it contains valid environment variables.",
		);
	}
}

export async function setCI(): Promise<Record<string, string>> {
	try {
		answers.CI = await promptList("CI", "Set CI:", ["true", "false"], "false");
	} catch (err) {
		console.error(err);
		if (fs.existsSync(".env.backup")) {
			fs.copyFileSync(".env.backup", ".env");
		}
		process.exit(1);
	}
	return answers;
}

export async function setNodeEnvironment(): Promise<Record<string, string>> {
	try {
		answers.NODE_ENV = await promptList(
			"NODE_ENV",
			"Select Node environment:",
			["development", "production", "test"],
			"production",
		);
	} catch (err) {
		console.error(err);
		if (fs.existsSync(".env.backup")) {
			fs.copyFileSync(".env.backup", ".env");
		}
		process.exit(1);
	}
	return answers;
}

export async function administratorEmail(): Promise<Record<string, string>> {
	try {
		answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = await promptInput(
			"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			"Enter email:",
			"administrator@email.com",
			validateEmail,
		);
	} catch (err) {
		console.log(err);
		if (fs.existsSync(".env.backup")) {
			fs.copyFileSync(".env.backup", ".env");
		}
		process.exit(1);
	}
	return answers;
}

export async function apiSetup(): Promise<Record<string, string>> {
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

	return answers;
}

export async function cloudbeaverSetup(): Promise<Record<string, string>> {
	answers.CLOUDBEAVER_ADMIN_NAME = await promptInput(
		"CLOUDBEAVER_ADMIN_NAME",
		"CloudBeaver admin name:",
		"talawa",
	);

	answers.CLOUDBEAVER_ADMIN_PASSWORD = await promptInput(
		"CLOUDBEAVER_ADMIN_PASSWORD",
		"CloudBeaver admin password:",
		"password",
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
		validateURL,
	);

	return answers;
}

export async function minioSetup(): Promise<Record<string, string>> {
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

	return answers;
}

export async function postgresSetup(): Promise<Record<string, string>> {
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

	return answers;
}

export async function setup(): Promise<Record<string, string>> {
	if (checkEnvFile()) {
		const { envReconfigure } = await inquirer.prompt([
			{
				type: "confirm",
				name: "envReconfigure",
				message: "Env file found. Re-configure? (Y)/N",
				default: true,
			},
		]);
		if (!envReconfigure) {
			process.exit(0);
		}
	}

	dotenv.config({ path: envFileName });

	process.on("SIGINT", () => {
		console.log("\nProcess interrupted! Undoing changes...");
		if (fs.existsSync(".env.backup")) {
			fs.copyFileSync(".env.backup", ".env");
		}
		answers = {};
		if (fs.existsSync(".env.backup")) {
			fs.copyFileSync(".env.backup", ".env");
		}
		process.exit(1);
	});

	await setCI();
	initializeEnvFile();
	await setNodeEnvironment();

	const { useDefaultApi } = await inquirer.prompt([
		{
			type: "confirm",
			name: "useDefaultApi",
			message: "Use recommended default API settings? (Y)/N",
			default: true,
		},
	]);
	if (!useDefaultApi) {
		await apiSetup();
	}

	const { useDefaultMinio } = await inquirer.prompt([
		{
			type: "confirm",
			name: "useDefaultMinio",
			message: "Use recommended default Minio settings? (Y)/N",
			default: true,
		},
	]);
	if (!useDefaultMinio) {
		await minioSetup();
	}

	if (answers.CI === "false") {
		const { useDefaultCloudbeaver } = await inquirer.prompt([
			{
				type: "confirm",
				name: "useDefaultCloudbeaver",
				message: "Use recommended default CloudBeaver settings? (Y)/N",
				default: true,
			},
		]);
		if (!useDefaultCloudbeaver) {
			await cloudbeaverSetup();
		}
	}

	const { useDefaultPostgres } = await inquirer.prompt([
		{
			type: "confirm",
			name: "useDefaultPostgres",
			message: "Use recommended default Postgres settings? (Y)/N",
			default: true,
		},
	]);
	if (!useDefaultPostgres) {
		await postgresSetup();
	}

	await administratorEmail();

	updateEnvVariable(answers);
	console.log("Configuration complete.");
	if (fs.existsSync(".env.backup")) {
		fs.unlinkSync(".env.backup");
	}
	return answers;
}
