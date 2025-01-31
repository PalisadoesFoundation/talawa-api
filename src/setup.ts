import crypto from "node:crypto";
import fs from "node:fs";
import { abort } from "node:process";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { updateEnvVariable } from "./setup/updateEnvVariable";

let answers: Record<string, string> = {};

const envFileName = ".env";

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

export function initializeEnvFile(): void {
	const envFileToUse =
		answers.CI === "true" ? "envFiles/.env.ci" : "envFiles/.env.devcontainer";

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
		answers.CI = CI;
	} catch (err) {
		console.error(err);
		abort();
	}
}

export async function setNodeEnvironment(): Promise<Record<string, string>> {
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
		answers.NODE_ENV = NODE_ENV;
	} catch (err) {
		console.error(err);
		abort();
	}
	return answers;
}

export async function administratorEmail(): Promise<Record<string, string>> {
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
		answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS =
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	} catch (err) {
		console.log(err);
		abort();
	}
	return answers;
}

export async function apiSetup(): Promise<Record<string, string>> {
	const { API_BASE_URL } = await inquirer.prompt([
		{
			type: "input",
			name: "API_BASE_URL",
			message: "API base URL:",
			default: "http://127.0.0.1:4000",
			validate: validateURL,
		},
	]);
	answers.API_BASE_URL = API_BASE_URL;

	const { API_HOST } = await inquirer.prompt([
		{
			type: "input",
			name: "API_HOST",
			message: "API host:",
			default: "0.0.0.0",
		},
	]);
	answers.API_HOST = API_HOST;

	const { API_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_PORT",
			message: "API port:",
			default: "4000",
			validate: validatePort,
		},
	]);
	answers.API_PORT = API_PORT;

	const { API_IS_APPLY_DRIZZLE_MIGRATIONS } = await inquirer.prompt([
		{
			type: "list",
			name: "API_IS_APPLY_DRIZZLE_MIGRATIONS",
			message: "Apply Drizzle migrations?",
			choices: ["true", "false"],
			default: "true",
		},
	]);
	answers.API_IS_APPLY_DRIZZLE_MIGRATIONS = API_IS_APPLY_DRIZZLE_MIGRATIONS;

	const { API_IS_GRAPHIQL } = await inquirer.prompt([
		{
			type: "list",
			name: "API_IS_GRAPHIQL",
			message: "Enable GraphQL?",
			choices: ["true", "false"],
			default: answers.CI === "false" ? "false" : "true",
		},
	]);
	answers.API_IS_GRAPHIQL = API_IS_GRAPHIQL;

	const { API_IS_PINO_PRETTY } = await inquirer.prompt([
		{
			type: "list",
			name: "API_IS_PINO_PRETTY",
			message: "Enable Pino Pretty logs?",
			choices: ["true", "false"],
			default: answers.CI === "false" ? "false" : "true",
		},
	]);
	answers.API_IS_PINO_PRETTY = API_IS_PINO_PRETTY;

	const { API_JWT_EXPIRES_IN } = await inquirer.prompt([
		{
			type: "input",
			name: "API_JWT_EXPIRES_IN",
			message: "JWT expiration (ms):",
			default: "2592000000",
		},
	]);
	answers.API_JWT_EXPIRES_IN = API_JWT_EXPIRES_IN;

	const jwtSecret = generateJwtSecret();

	const { API_JWT_SECRET } = await inquirer.prompt([
		{
			type: "input",
			name: "API_JWT_SECRET",
			message: "JWT secret:",
			default: jwtSecret,
			validate: (input: string) => {
				if (input.length < 128) {
					return "JWT secret must be at least 128 characters long.";
				}
				return true;
			},
		},
	]);
	answers.API_JWT_SECRET = API_JWT_SECRET;

	const { API_LOG_LEVEL } = await inquirer.prompt([
		{
			type: "input",
			name: "API_LOG_LEVEL",
			message: "LOG level:",
			choices: ["info", "debug"],
			default: answers.CI === "true" ? "info" : "debug",
		},
	]);
	answers.API_LOG_LEVEL = API_LOG_LEVEL;

	const { API_MINIO_ACCESS_KEY } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_ACCESS_KEY",
			message: "Minio access key:",
			default: "talawa",
		},
	]);
	answers.API_MINIO_ACCESS_KEY = API_MINIO_ACCESS_KEY;

	const { API_MINIO_END_POINT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_END_POINT",
			message: "Minio endpoint:",
			default: "minio",
		},
	]);
	answers.API_MINIO_END_POINT = API_MINIO_END_POINT;

	const { API_MINIO_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_PORT",
			message: "Minio port:",
			default: "9000",
		},
	]);
	answers.API_MINIO_PORT = API_MINIO_PORT;

	const { API_MINIO_SECRET_KEY } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_SECRET_KEY",
			message: "Minio secret key:",
			default: "password",
		},
	]);
	answers.API_MINIO_SECRET_KEY = API_MINIO_SECRET_KEY;

	const { API_MINIO_TEST_END_POINT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_MINIO_TEST_END_POINT",
			message: "Minio test endpoint:",
			default: "minio-test",
		},
	]);
	answers.API_MINIO_TEST_END_POINT = API_MINIO_TEST_END_POINT;

	const { API_MINIO_USE_SSL } = await inquirer.prompt([
		{
			type: "list",
			name: "API_MINIO_USE_SSL",
			message: "Use Minio SSL?",
			choices: ["true", "false"],
			default: "false",
		},
	]);
	answers.API_MINIO_USE_SSL = API_MINIO_USE_SSL;

	const { API_POSTGRES_DATABASE } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_DATABASE",
			message: "Postgres database:",
			default: "talawa",
		},
	]);
	answers.API_POSTGRES_DATABASE = API_POSTGRES_DATABASE;

	const { API_POSTGRES_HOST } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_HOST",
			message: "Postgres host:",
			default: "postgres",
		},
	]);
	answers.API_POSTGRES_HOST = API_POSTGRES_HOST;

	const { API_POSTGRES_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_PASSWORD",
			message: "Postgres password:",
			default: "password",
		},
	]);
	answers.API_POSTGRES_PASSWORD = API_POSTGRES_PASSWORD;

	const { API_POSTGRES_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_PORT",
			message: "Postgres port:",
			default: "5432",
		},
	]);
	answers.API_POSTGRES_PORT = API_POSTGRES_PORT;

	const { API_POSTGRES_SSL_MODE } = await inquirer.prompt([
		{
			type: "list",
			name: "API_POSTGRES_SSL_MODE",
			message: "Use Postgres SSL?",
			choices: ["true", "false"],
			default: "false",
		},
	]);
	answers.API_POSTGRES_SSL_MODE = API_POSTGRES_SSL_MODE;

	const { API_POSTGRES_TEST_HOST } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_TEST_HOST",
			message: "Postgres test host:",
			default: "postgres-test",
		},
	]);
	answers.API_POSTGRES_TEST_HOST = API_POSTGRES_TEST_HOST;

	const { API_POSTGRES_USER } = await inquirer.prompt([
		{
			type: "input",
			name: "API_POSTGRES_USER",
			message: "Postgres user:",
			default: "talawa",
		},
	]);
	answers.API_POSTGRES_USER = API_POSTGRES_USER;
	return answers;
}

export async function cloudbeaverSetup(): Promise<Record<string, string>> {
	const { CLOUDBEAVER_ADMIN_NAME } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_ADMIN_NAME",
			message: "CloudBeaver admin name:",
			default: "talawa",
		},
	]);
	answers.CLOUDBEAVER_ADMIN_NAME = CLOUDBEAVER_ADMIN_NAME;

	const { CLOUDBEAVER_ADMIN_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_ADMIN_PASSWORD",
			message: "CloudBeaver admin password:",
			default: "password",
		},
	]);
	answers.CLOUDBEAVER_ADMIN_PASSWORD = CLOUDBEAVER_ADMIN_PASSWORD;

	const { CLOUDBEAVER_MAPPED_HOST_IP } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_MAPPED_HOST_IP",
			message: "CloudBeaver mapped host IP:",
			default: "127.0.0.1",
		},
	]);
	answers.CLOUDBEAVER_MAPPED_HOST_IP = CLOUDBEAVER_MAPPED_HOST_IP;

	const { CLOUDBEAVER_MAPPED_PORT } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_MAPPED_PORT",
			message: "CloudBeaver mapped port:",
			default: "8978",
			validate: validatePort,
		},
	]);
	answers.CLOUDBEAVER_MAPPED_PORT = CLOUDBEAVER_MAPPED_PORT;

	const { CLOUDBEAVER_SERVER_NAME } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_SERVER_NAME",
			message: "CloudBeaver server name:",
			default: "Talawa CloudBeaver Server",
		},
	]);
	answers.CLOUDBEAVER_SERVER_NAME = CLOUDBEAVER_SERVER_NAME;

	const { CLOUDBEAVER_SERVER_URL } = await inquirer.prompt([
		{
			type: "input",
			name: "CLOUDBEAVER_SERVER_URL",
			message: "CloudBeaver server URL:",
			default: "http://127.0.0.1:8978",
			validate: validateURL,
		},
	]);
	answers.CLOUDBEAVER_SERVER_URL = CLOUDBEAVER_SERVER_URL;
	return answers;
}

export async function minioSetup(): Promise<Record<string, string>> {
	const { MINIO_BROWSER } = await inquirer.prompt([
		{
			type: "input",
			name: "MINIO_BROWSER",
			message: "Minio browser (on/off):",
			default: answers.CI === "true" ? "off" : "on",
		},
	]);
	answers.MINIO_BROWSER = MINIO_BROWSER;

	if (answers.CI === "false") {
		const { MINIO_API_MAPPED_HOST_IP } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_API_MAPPED_HOST_IP",
				message: "Minio API mapped host IP:",
				default: "127.0.0.1",
			},
		]);
		answers.MINIO_API_MAPPED_HOST_IP = MINIO_API_MAPPED_HOST_IP;

		const { MINIO_API_MAPPED_PORT } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_API_MAPPED_PORT",
				message: "Minio API mapped port:",
				default: "9000",
				validate: validatePort,
			},
		]);
		answers.MINIO_API_MAPPED_PORT = MINIO_API_MAPPED_PORT;

		const { MINIO_CONSOLE_MAPPED_HOST_IP } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_CONSOLE_MAPPED_HOST_IP",
				message: "Minio console mapped host IP:",
				default: "127.0.0.1",
			},
		]);
		answers.MINIO_CONSOLE_MAPPED_HOST_IP = MINIO_CONSOLE_MAPPED_HOST_IP;

		const { MINIO_CONSOLE_MAPPED_PORT } = await inquirer.prompt([
			{
				type: "input",
				name: "MINIO_CONSOLE_MAPPED_PORT",
				message: "Minio console mapped port:",
				default: "9001",
				validate: validatePort,
			},
		]);
		answers.MINIO_CONSOLE_MAPPED_PORT = MINIO_CONSOLE_MAPPED_PORT;
	}

	const { MINIO_ROOT_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "MINIO_ROOT_PASSWORD",
			message: "Minio root password:",
			default: "password",
		},
	]);
	answers.MINIO_ROOT_PASSWORD = MINIO_ROOT_PASSWORD;

	const { MINIO_ROOT_USER } = await inquirer.prompt([
		{
			type: "input",
			name: "MINIO_ROOT_USER",
			message: "Minio root user:",
			default: "talawa",
		},
	]);
	answers.MINIO_ROOT_USER = MINIO_ROOT_USER;
	return answers;
}

export async function postgresSetup(): Promise<Record<string, string>> {
	const { POSTGRES_DB } = await inquirer.prompt([
		{
			type: "input",
			name: "POSTGRES_DB",
			message: "Postgres database:",
			default: "talawa",
		},
	]);
	answers.POSTGRES_DB = POSTGRES_DB;

	if (answers.CI === "false") {
		const { POSTGRES_MAPPED_HOST_IP } = await inquirer.prompt([
			{
				type: "input",
				name: "POSTGRES_MAPPED_HOST_IP",
				message: "Postgres mapped host IP:",
				default: "127.0.0.1",
			},
		]);
		answers.POSTGRES_MAPPED_HOST_IP = POSTGRES_MAPPED_HOST_IP;

		const { POSTGRES_MAPPED_PORT } = await inquirer.prompt([
			{
				type: "input",
				name: "POSTGRES_MAPPED_PORT",
				message: "Postgres mapped port:",
				default: "5432",
				validate: validatePort,
			},
		]);
		answers.POSTGRES_MAPPED_PORT = POSTGRES_MAPPED_PORT;
	}

	const { POSTGRES_PASSWORD } = await inquirer.prompt([
		{
			type: "input",
			name: "POSTGRES_PASSWORD",
			message: "Postgres password:",
			default: "password",
		},
	]);
	answers.POSTGRES_PASSWORD = POSTGRES_PASSWORD;

	const { POSTGRES_USER } = await inquirer.prompt([
		{
			type: "input",
			name: "POSTGRES_USER",
			message: "Postgres user:",
			default: "talawa",
		},
	]);
	answers.POSTGRES_USER = POSTGRES_USER;
	return answers;
}

export async function setup(): Promise<void> {
	if (checkEnvFile()) {
		const { envReconfigure } = await inquirer.prompt([
			{
				type: "confirm",
				name: "envReconfigure",
				message: "Env file found, Do you want to re-configure? (Y)/N",
				default: true,
			},
		]);
		if (!envReconfigure) {
			process.exit(1);
		}
	}
	dotenv.config({ path: envFileName });
	await setCI();
	initializeEnvFile();

	process.on("SIGINT", () => {
		console.log("\nProcess interrupted! Undoing changes...");
		answers = {};
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

	if (answers.CI === "false") {
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

	updateEnvVariable(answers);
	console.log("Configuration complete.");
}
