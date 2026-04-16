import type { SetupAnswers, SetupKey } from "./sharedSetup";

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
		"API_IS_SECURE_COOKIES",
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
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		return "Please enter valid sampling ratio (0-1).";
	}
	const ratio = Number(trimmed);
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
