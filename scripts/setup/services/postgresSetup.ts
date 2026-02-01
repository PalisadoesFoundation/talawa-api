import { promptInput } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";
import { validatePort, validateSecurePassword } from "../validators.js";

/**
 * Prompt for Postgres configuration.
 *
 * @param answers - Accumulated setup answers.
 * @returns Updated answers with Postgres settings.
 */
export async function postgresSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
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
	// Use already-synced API_POSTGRES_PASSWORD as default if available
	const postgresPasswordDefault =
		answers.API_POSTGRES_PASSWORD ??
		answers.POSTGRES_PASSWORD ??
		process.env.POSTGRES_PASSWORD ??
		"password";
	answers.POSTGRES_PASSWORD = await promptInput(
		"POSTGRES_PASSWORD",
		"Postgres password:",
		postgresPasswordDefault,
		validateSecurePassword,
	);
	// Sync back to API_POSTGRES_PASSWORD if it was set
	if (answers.API_POSTGRES_PASSWORD !== undefined) {
		if (answers.POSTGRES_PASSWORD !== answers.API_POSTGRES_PASSWORD) {
			// User changed POSTGRES_PASSWORD, update API_POSTGRES_PASSWORD to match
			answers.API_POSTGRES_PASSWORD = answers.POSTGRES_PASSWORD;
			process.env.POSTGRES_PASSWORD = answers.POSTGRES_PASSWORD;
			console.log(
				"ℹ️  API_POSTGRES_PASSWORD updated to match POSTGRES_PASSWORD",
			);
		}
	} else {
		// No API_POSTGRES_PASSWORD set yet, set it now
		answers.API_POSTGRES_PASSWORD = answers.POSTGRES_PASSWORD;
		process.env.POSTGRES_PASSWORD = answers.POSTGRES_PASSWORD;
	}
	answers.POSTGRES_USER = await promptInput(
		"POSTGRES_USER",
		"Postgres user:",
		"talawa",
	);
	return answers;
}
