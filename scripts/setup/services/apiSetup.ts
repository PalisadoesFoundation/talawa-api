import { promptInput, promptList } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";
import {
	generateJwtSecret,
	generateSecurePassword,
	validateHmacSecretLength,
	validateJwtSecretLength,
	validatePort,
	validateSecurePassword,
	validateTokenExpiration,
	validateURL,
} from "../validators.js";

export async function apiSetup(answers: SetupAnswers): Promise<SetupAnswers> {
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
		validateTokenExpiration,
	);
	const jwtSecret = generateJwtSecret();
	answers.API_JWT_SECRET = await promptInput(
		"API_JWT_SECRET",
		"JWT secret:",
		jwtSecret,
		validateJwtSecretLength,
	);

	answers.API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS = await promptInput(
		"API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS",
		"Email verification token expiration (seconds):",
		"86400",
		validateTokenExpiration,
	);

	const emailVerificationSecret = generateJwtSecret();
	answers.API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET = await promptInput(
		"API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET",
		"Email verification HMAC secret:",
		emailVerificationSecret,
		validateHmacSecretLength,
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
		validatePort,
	);
	// Treat empty string as unset so users can supply a new secret
	const rawMinioPassword =
		answers.MINIO_ROOT_PASSWORD ?? process.env.MINIO_ROOT_PASSWORD;
	const existingMinioPassword = rawMinioPassword || undefined;
	answers.API_MINIO_SECRET_KEY = await promptInput(
		"API_MINIO_SECRET_KEY",
		"Minio secret key:",
		existingMinioPassword ?? generateSecurePassword(),
		validateSecurePassword,
	);
	if (existingMinioPassword === undefined) {
		// No configured value (or empty): set both answers.MINIO_ROOT_PASSWORD and
		// process.env.MINIO_ROOT_PASSWORD to answers.API_MINIO_SECRET_KEY
		// so the chosen API_MINIO_SECRET_KEY becomes the stored Minio password
		answers.MINIO_ROOT_PASSWORD = answers.API_MINIO_SECRET_KEY;
		process.env.MINIO_ROOT_PASSWORD = answers.API_MINIO_SECRET_KEY;
		console.log(
			"ℹ️  MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
		);
	} else {
		// Configured non-empty password found, validate against it
		const minioPassword = existingMinioPassword;
		while (answers.API_MINIO_SECRET_KEY !== minioPassword) {
			console.warn("⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD.");
			answers.API_MINIO_SECRET_KEY = await promptInput(
				"API_MINIO_SECRET_KEY",
				"Minio secret key:",
				minioPassword, // Use configured password as default
				validateSecurePassword,
			);
		}
		console.log("✅ API_MINIO_SECRET_KEY matches MINIO_ROOT_PASSWORD");
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
	// Treat empty string as unset so users can supply a new secret
	const rawPostgresPassword =
		answers.POSTGRES_PASSWORD ?? process.env.POSTGRES_PASSWORD;
	const postgresPassword = rawPostgresPassword || undefined;
	answers.API_POSTGRES_PASSWORD = await promptInput(
		"API_POSTGRES_PASSWORD",
		"Postgres password:",
		postgresPassword ?? generateSecurePassword(),
		validateSecurePassword,
	);
	if (postgresPassword === undefined) {
		// No configured value (or empty): set both answers.POSTGRES_PASSWORD and
		// process.env.POSTGRES_PASSWORD to answers.API_POSTGRES_PASSWORD
		// so the chosen API_POSTGRES_PASSWORD becomes the stored Postgres password
		answers.POSTGRES_PASSWORD = answers.API_POSTGRES_PASSWORD;
		process.env.POSTGRES_PASSWORD = answers.API_POSTGRES_PASSWORD;
		console.log(
			"ℹ️  POSTGRES_PASSWORD will be set to match API_POSTGRES_PASSWORD",
		);
	} else {
		// Configured non-empty password found, validate against it
		const postgresPasswordLocal = postgresPassword;
		while (answers.API_POSTGRES_PASSWORD !== postgresPasswordLocal) {
			console.warn("⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD.");
			answers.API_POSTGRES_PASSWORD = await promptInput(
				"API_POSTGRES_PASSWORD",
				"Postgres password:",
				postgresPasswordLocal, // Use configured password as default
				validateSecurePassword,
			);
		}
		console.log("✅ API_POSTGRES_PASSWORD matches POSTGRES_PASSWORD");
	}
	answers.API_POSTGRES_PORT = await promptInput(
		"API_POSTGRES_PORT",
		"Postgres port:",
		"5432",
		validatePort,
	);
	answers.API_POSTGRES_SSL_MODE = await promptList(
		"API_POSTGRES_SSL_MODE",
		"Select Postgres SSL mode:",
		["false", "true", "allow", "prefer", "require", "verify-full"],
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
