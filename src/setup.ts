import crypto from "node:crypto";
import fs from "node:fs";
import { abort } from "node:process";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { updateEnvVariable } from "./setup/updateEnvVariable";

export function generateJwtSecret(): string {
	try {
		return crypto.randomBytes(64).toString("hex");
	} catch (err) {
		console.error("Failed to generate JWT secret:", err);
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
		console.log("Email cannot be empty.");
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

function checkEnvFile(): boolean {
	if (fs.existsSync(envFileName)) {
		return true;
	}
	return false;
}

let originalEnvContent: string | null = null;
const envFileName = ".env";

function backupEnvFile(): void {
	if (fs.existsSync(envFileName)) {
		originalEnvContent = fs.readFileSync(envFileName, "utf-8");
	} else {
		originalEnvContent = null;
	}
}

export function restoreEnvFile(): void {
	try {
		if (originalEnvContent !== null) {
			fs.writeFileSync(envFileName, originalEnvContent, "utf-8");
			console.log("\nChanges undone. Restored the original environment file.");
		} else if (fs.existsSync(envFileName)) {
			fs.unlinkSync(envFileName);
			console.log("\nChanges undone. Removed the environment file.");
		}
	} catch (err) {
		console.error("Error restoring env file:", err);
	}
}

export function initializeEnvFile(): void {
	const envFileToUse =
		process.env.CI === "true"
			? "envFiles/.env.ci"
			: "envFiles/.env.devcontainer";

	const envFileName = ".env";

	const parsedEnv = dotenv.parse(fs.readFileSync(envFileToUse));

	dotenv.config({ path: envFileName });
	const content = Object.entries(parsedEnv)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");
	fs.writeFileSync(envFileName, content, { encoding: "utf-8" });
}

export async function setCI(): Promise<void> {
	try {
		const { CI } = await inquirer.prompt([
			{
				type: "list",
				name: "CI",
				message: "Set CI:",
				choices: ["true", "false"],
				default: "false",
			},
		]);
		updateEnvVariable({ CI });
	} catch (err) {
		console.error(err);
		abort();
	}
}

export async function setNodeEnvironment(): Promise<void> {
	try {
		const { NODE_ENV } = await inquirer.prompt([
			{
				type: "list",
				name: "NODE_ENV",
				message: "Select Node environment:",
				choices: ["development", "production", "test"],
				default: "production",
			},
		]);
		updateEnvVariable({ NODE_ENV });
	} catch (err) {
		console.error(err);
		abort();
	}
}

export async function administratorEmail(): Promise<void> {
	try {
		const { API_ADMINISTRATOR_USER_EMAIL_ADDRESS } = await inquirer.prompt([
			{
				type: "input",
				name: "API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
				message: "Enter email :",
				default: "administrator@email.com",
				validate: validateEmail,
			},
		]);
		updateEnvVariable({ API_ADMINISTRATOR_USER_EMAIL_ADDRESS });
	} catch (err) {
		console.log(err);
		abort();
	}
}

export async function apiSetup(): Promise<void> {
	const { API_BASE_URL } = await inquirer.prompt([
		{
			type: "input",
			name: "API_BASE_URL",
			message: "API base URL:",
			default: "http://127.0.0.1:4000",
			validate: validateURL,
		},
	]);
	updateEnvVariable({ API_BASE_URL });

	const { API_HOST } = await inquirer.prompt([
		{
			type: "input",
			name: "API_HOST",
			message: "API host:",
			default: "0.0.0.0",
		},
	]);
	updateEnvVariable({ API_HOST });

	const { API_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_PORT",
			message: "API port:",
			default: "4000",
			validate: validatePort,
		},
	]);
	updateEnvVariable({ API_PORT });

	const { API_IS_APPLY_DRIZZLE_MIGRATIONS } = await inquirer.prompt([
		{
			type: "list",
			name: "API_IS_APPLY_DRIZZLE_MIGRATIONS",
			message: "Apply Drizzle migrations?",
			choices: ["true", "false"],
			default: "true",
		},
	]);
	updateEnvVariable({ API_IS_APPLY_DRIZZLE_MIGRATIONS });

	const { API_IS_GRAPHIQL } = await inquirer.prompt([
		{
			type: "list",
			name: "API_IS_GRAPHIQL",
			message: "Enable GraphQL?",
			choices: ["true", "false"],
			default: process.env.CI === "false" ? "false" : "true",
		},
	]);
	updateEnvVariable({ API_IS_GRAPHIQL });

	const { API_IS_PINO_PRETTY } = await inquirer.prompt([
		{
			type: "list",
			name: "API_IS_PINO_PRETTY",
			message: "Enable Pino Pretty logs?",
			choices: ["true", "false"],
			default: process.env.CI === "false" ? "false" : "true",
		},
	]);
	updateEnvVariable({ API_IS_PINO_PRETTY });

	const { API_JWT_EXPIRES_IN } = await inquirer.prompt([
		{
			type: "input",
			name: "API_JWT_EXPIRES_IN",
			message: "JWT expiration (ms):",
			default: "2592000000",
		},
	]);
	updateEnvVariable({ API_JWT_EXPIRES_IN });

	const jwtSecret = generateJwtSecret();

	const { API_JWT_SECRET } = await inquirer.prompt([
		{
			type: "input",
			name: "API_JWT_SECRET",
			message: "JWT secret:",
			default: jwtSecret,
			validate: (input: string) => {
				if (input.length < 64) {
					return "JWT secret must be at least 64 characters long.";
				}
				return true;
			},
		},
	]);
	updateEnvVariable({ API_JWT_SECRET });

	const { API_LOG_LEVEL } = await inquirer.prompt([
		{
			type: "input",
			name: "API_LOG_LEVEL",
			message: "LOG level:",
			choices: ["info", "debug"],
			default: process.env.CI === "true" ? "info" : "debug",
		},
	]);
	updateEnvVariable({ API_LOG_LEVEL });

	const { API_MINIO_ACCESS_KEY } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_ACCESS_KEY",
			message: "Minio access key:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ API_MINIO_ACCESS_KEY });

	const { API_MINIO_END_POINT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_END_POINT",
			message: "Minio endpoint:",
			default: "minio",
		},
	]);
	updateEnvVariable({ API_MINIO_END_POINT });

	const { API_MINIO_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_PORT",
			message: "Minio port:",
			default: "9000",
		},
	]);
	updateEnvVariable({ API_MINIO_PORT });

	const { API_MINIO_SECRET_KEY } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_SECRET_KEY",
			message: "Minio secret key:",
			default: "password",
		},
	]);
	updateEnvVariable({ API_MINIO_SECRET_KEY });

	const { API_MINIO_TEST_END_POINT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_TEST_END_POINT",
			message: "Minio test endpoint:",
			default: "minio-test",
		},
	]);
	updateEnvVariable({ API_MINIO_TEST_END_POINT });

	const { API_MINIO_USE_SSL } = await inquirer.prompt([
		{
			type: "list",
			name: "API_MINIO_USE_SSL",
			message: "Use Minio SSL?",
			choices: ["true", "false"],
			default: "false",
		},
	]);
	updateEnvVariable({ API_MINIO_USE_SSL });

	const { API_POSTGRES_DATABASE } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_DATABASE",
			message: "Postgres database:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ API_POSTGRES_DATABASE });

	const { API_POSTGRES_HOST } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_HOST",
			message: "Postgres host:",
			default: "postgres",
		},
	]);
	updateEnvVariable({ API_POSTGRES_HOST });

	const { API_POSTGRES_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_PASSWORD",
			message: "Postgres password:",
			default: "password",
		},
	]);
	updateEnvVariable({ API_POSTGRES_PASSWORD });

	const { API_POSTGRES_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_PORT",
			message: "Postgres port:",
			default: "5432",
		},
	]);
	updateEnvVariable({ API_POSTGRES_PORT });

	const { API_POSTGRES_SSL_MODE } = await inquirer.prompt([
		{
			type: "list",
			name: "API_POSTGRES_SSL_MODE",
			message: "Use Postgres SSL?",
			choices: ["true", "false"],
			default: "false",
		},
	]);
	updateEnvVariable({ API_POSTGRES_SSL_MODE });

	const { API_POSTGRES_TEST_HOST } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_TEST_HOST",
			message: "Postgres test host:",
			default: "postgres-test",
		},
	]);
	updateEnvVariable({ API_POSTGRES_TEST_HOST });

	const { API_POSTGRES_USER } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_USER",
			message: "Postgres user:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ API_POSTGRES_USER });
	console.log("Environment variables updated.");
}

export async function cloudbeaverSetup(): Promise<void> {
	const { CLOUDBEAVER_ADMIN_NAME } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_ADMIN_NAME",
			message: "CloudBeaver admin name:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ CLOUDBEAVER_ADMIN_NAME });

	const { CLOUDBEAVER_ADMIN_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_ADMIN_PASSWORD",
			message: "CloudBeaver admin password:",
			default: "password",
		},
	]);
	updateEnvVariable({ CLOUDBEAVER_ADMIN_PASSWORD });

	const { CLOUDBEAVER_MAPPED_HOST_IP } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_MAPPED_HOST_IP",
			message: "CloudBeaver mapped host IP:",
			default: "127.0.0.1",
		},
	]);
	updateEnvVariable({ CLOUDBEAVER_MAPPED_HOST_IP });

	const { CLOUDBEAVER_MAPPED_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_MAPPED_PORT",
			message: "CloudBeaver mapped port:",
			default: "8978",
			validate: validatePort,
		},
	]);
	updateEnvVariable({ CLOUDBEAVER_MAPPED_PORT });

	const { CLOUDBEAVER_SERVER_NAME } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_SERVER_NAME",
			message: "CloudBeaver server name:",
			default: "Talawa CloudBeaver Server",
		},
	]);
	updateEnvVariable({ CLOUDBEAVER_SERVER_NAME });

	const { CLOUDBEAVER_SERVER_URL } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_SERVER_URL",
			message: "CloudBeaver server URL:",
			default: "http://127.0.0.1:8978",
			validate: validateURL,
		},
	]);
	updateEnvVariable({ CLOUDBEAVER_SERVER_URL });
	console.log("CloudBeaver environment variables updated.");
}

export async function minioSetup(): Promise<void> {
	const { MINIO_BROWSER } = await inquirer.prompt([
		{
			type: "input",
			name: "MINIO_BROWSER",
			message: "Minio browser (on/off):",
			default: process.env.CI === "true" ? "off" : "on",
		},
	]);
	updateEnvVariable({ MINIO_BROWSER });

	if (process.env.CI === "false") {
		const { MINIO_API_MAPPED_HOST_IP } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_API_MAPPED_HOST_IP",
				message: "Minio API mapped host IP:",
				default: "127.0.0.1",
			},
		]);
		updateEnvVariable({ MINIO_API_MAPPED_HOST_IP });

		const { MINIO_API_MAPPED_PORT } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_API_MAPPED_PORT",
				message: "Minio API mapped port:",
				default: "9000",
				validate: validatePort,
			},
		]);
		updateEnvVariable({ MINIO_API_MAPPED_PORT });

		const { MINIO_CONSOLE_MAPPED_HOST_IP } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_CONSOLE_MAPPED_HOST_IP",
				message: "Minio console mapped host IP:",
				default: "127.0.0.1",
			},
		]);
		updateEnvVariable({ MINIO_CONSOLE_MAPPED_HOST_IP });

		const { MINIO_CONSOLE_MAPPED_PORT } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_CONSOLE_MAPPED_PORT",
				message: "Minio console mapped port:",
				default: "9001",
				validate: validatePort,
			},
		]);
		updateEnvVariable({ MINIO_CONSOLE_MAPPED_PORT });
	}

	const { MINIO_ROOT_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "MINIO_ROOT_PASSWORD",
			message: "Minio root password:",
			default: "password",
		},
	]);
	updateEnvVariable({ MINIO_ROOT_PASSWORD });

	const { MINIO_ROOT_USER } = await inquirer.prompt([
		{
			type: "input",
			name: "MINIO_ROOT_USER",
			message: "Minio root user:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ MINIO_ROOT_USER });
	console.log("Minio environment variables updated.");
}

export async function postgresSetup(): Promise<void> {
	console.log("\n--- Postgres Setup ---");

	const { POSTGRES_DB } = await inquirer.prompt([
		{
			type: "input",
			name: "POSTGRES_DB",
			message: "Postgres database:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ POSTGRES_DB });

	if (process.env.CI === "false") {
		const { POSTGRES_MAPPED_HOST_IP } = await inquirer.prompt([
			{
				type: "input",
				name: "POSTGRES_MAPPED_HOST_IP",
				message: "Postgres mapped host IP:",
				default: "127.0.0.1",
			},
		]);
		updateEnvVariable({ POSTGRES_MAPPED_HOST_IP });

		const { POSTGRES_MAPPED_PORT } = await inquirer.prompt([
			{
				type: "input",
				name: "POSTGRES_MAPPED_PORT",
				message: "Postgres mapped port:",
				default: "5432",
				validate: validatePort,
			},
		]);
		updateEnvVariable({ POSTGRES_MAPPED_PORT });
	}

	const { POSTGRES_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "POSTGRES_PASSWORD",
			message: "Postgres password:",
			default: "password",
		},
	]);
	updateEnvVariable({ POSTGRES_PASSWORD });

	const { POSTGRES_USER } = await inquirer.prompt([
		{
			type: "input",
			name: "POSTGRES_USER",
			message: "Postgres user:",
			default: "talawa",
		},
	]);
	updateEnvVariable({ POSTGRES_USER });
}

export async function setup(): Promise<void> {
	if (checkEnvFile()) {
		const { envExists } = await inquirer.prompt([
			{
				type: "confirm",
				name: "envExists",
				message: "Env file found, Do you want to re-configure? (Y)/N",
				default: true,
			},
		]);
		if (!envExists) {
			process.exit(1);
		}
	}
	dotenv.config({ path: envFileName });
	backupEnvFile();
	await setCI();
	initializeEnvFile();

	process.on("SIGINT", () => {
		console.log("\nProcess interrupted! Undoing changes...");
		restoreEnvFile();
		process.exit(1);
	});
	await setNodeEnvironment();

	const { useDefaultApi } = await inquirer.prompt([
		{
			type: "confirm",
			name: "useDefaultApi",
			message: "Do you want to use the recommended default API settings? (Y)/N",
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
			message:
				"Do you want to use the recommended default Minio settings? (Y)/N",
			default: true,
		},
	]);
	if (!useDefaultMinio) {
		await minioSetup();
	}

	if (process.env.CI === "false") {
		const { useDefaultCloudbeaver } = await inquirer.prompt([
			{
				type: "confirm",
				name: "useDefaultCloudbeaver",
				message:
					"Do you want to use the recommended default CloudBeaver settings? (Y)/N",
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
			message:
				"Do you want to use the recommended default Postgres settings? (Y)/N",
			default: true,
		},
	]);
	if (!useDefaultPostgres) {
		await postgresSetup();
	}
	await administratorEmail();

	console.log("Configuration complete.");
}
