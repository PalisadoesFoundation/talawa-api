import crypto from "node:crypto";

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

/**
 * Type guard to check if a value is a valid boolean string.
 */
export function isBooleanString(value: unknown): value is "true" | "false" {
	return value === "true" || value === "false";
}

/**
 * Validates that all required fields are present in the answers.
 * @param answers - The setup answers to validate
 * @throws {Error} If required fields are missing
 */
export function validateRequiredFields(answers: SetupAnswers): void {
	const requiredFields: (keyof SetupAnswers)[] = [
		"CI",
		"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
	];

	const missingFields: string[] = [];

	for (const field of requiredFields) {
		if (answers[field] === undefined || answers[field] === "") {
			missingFields.push(String(field));
		}
	}

	if (missingFields.length > 0) {
		throw new Error(
			`Missing required configuration fields:\n  - ${missingFields.join(
				"\n  - ",
			)}`,
		);
	}
}

/**
 * Validates that boolean fields have valid values.
 * @param answers - The setup answers to validate
 * @throws {Error} If boolean fields have invalid values
 */
export function validateBooleanFields(answers: SetupAnswers): void {
	const booleanFields: (keyof SetupAnswers)[] = [
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
			invalidFields.push(`${field} (got: ${value})`);
		}
	}

	if (invalidFields.length > 0) {
		throw new Error(
			`Boolean fields must be "true" or "false":\n  - ${invalidFields.join(
				"\n  - ",
			)}`,
		);
	}
}

/**
 * Validates that port numbers are valid (1-65535).
 * @param answers - The setup answers to validate
 * @throws {Error} If port numbers are invalid
 */
export function validatePortNumbers(answers: SetupAnswers): void {
	const portFields: (keyof SetupAnswers)[] = [
		"API_PORT",
		"API_MINIO_PORT",
		"API_POSTGRES_PORT",
		"MINIO_API_MAPPED_PORT",
		"MINIO_CONSOLE_MAPPED_PORT",
		"POSTGRES_MAPPED_PORT",
		"CLOUDBEAVER_MAPPED_PORT",
		"CADDY_HTTP_MAPPED_PORT",
		"CADDY_HTTPS_MAPPED_PORT",
		"CADDY_HTTP3_MAPPED_PORT",
		"CADDY_TALAWA_API_PORT",
	];

	const invalidPorts: string[] = [];

	for (const field of portFields) {
		const value = answers[field];
		if (value !== undefined) {
			const port = Number.parseInt(value, 10);
			if (Number.isNaN(port) || port < 1 || port > 65535) {
				invalidPorts.push(`${field} (got: ${value})`);
			}
		}
	}

	if (invalidPorts.length > 0) {
		throw new Error(
			`Port numbers must be between 1 and 65535:\n  - ${invalidPorts.join(
				"\n  - ",
			)}`,
		);
	}
}

/**
 * Comprehensive validation of all answers before writing to .env.
 * @param answers - The setup answers to validate
 * @throws {Error} If any validation fails
 */
export function validateAllAnswers(answers: SetupAnswers): void {
	console.log("\n📋 Validating configuration...");

	validateRequiredFields(answers);
	validateBooleanFields(answers);
	validatePortNumbers(answers);

	console.log("✅ All validations passed");
}

/**
 * Validates that a string is a well-formed URL with http or https protocol.
 * @param input - The URL string to validate
 * @returns true if valid, otherwise an error message string
 */
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

/**
 * Validates that a string represents a valid port number (1-65535).
 * @param input - The port number as a string
 * @returns true if valid, otherwise an error message string
 */
export function validatePort(input: string): true | string {
	const portNumber = Number(input);
	if (Number.isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
		return "Please enter a valid port number (1-65535).";
	}
	return true;
}

/**
 * Validates that a string represents a valid sampling ratio between 0 and 1.
 * @param input - The sampling ratio as a string
 * @returns true if valid, otherwise an error message string
 */
export function validateSamplingRatio(input: string): true | string {
	const ratio = Number(input);
	if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
		return "Please enter valid sampling ratio (0-1).";
	}
	return true;
}

/**
 * Validates that a string is a properly formatted email address.
 * @param input - The email address to validate
 * @returns true if valid, otherwise an error message string
 */
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

/**
 * Validates the CloudBeaver admin name for required format and length.
 * @param input - The admin name to validate
 * @returns true if valid, otherwise an error message string
 */
export function validateCloudBeaverAdmin(input: string): true | string {
	if (!input) return "Admin name is required";
	if (input.length < 3) return "Admin name must be at least 3 characters long";
	if (!/^[a-zA-Z0-9_]+$/.test(input))
		return "Admin name can only contain letters, numbers, and underscores";
	return true;
}

/**
 * Validates the CloudBeaver admin password for required format and strength.
 * @param input - The password to validate
 * @returns true if valid, otherwise an error message string
 */
export function validateCloudBeaverPassword(input: string): true | string {
	if (!input) return "Password is required";
	if (input.length < 8) return "Password must be at least 8 characters long";
	if (!/[A-Za-z]/.test(input) || !/[0-9]/.test(input)) {
		return "Password must contain both letters and numbers";
	}
	return true;
}

/**
 * Validates the CloudBeaver server URL for protocol and port correctness.
 * @param input - The server URL to validate
 * @returns true if valid, otherwise an error message string
 */
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

/**
 * Generates a cryptographically secure random JWT secret string.
 * Uses 64 random bytes and returns as a hexadecimal string.
 * @returns A 128-character hex string suitable for JWT secret
 * @throws {Error} If random byte generation fails due to insufficient permissions
 */
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
