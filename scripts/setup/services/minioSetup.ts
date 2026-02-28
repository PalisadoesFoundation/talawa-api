import * as process from "node:process";
import { promptInput } from "../promptHelpers";
import { validatePort } from "../validators";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

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
			while (portConflict) {
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
		// Use already-synced API_MINIO_SECRET_KEY as default if available
		const minioPasswordDefault =
			answers.API_MINIO_SECRET_KEY ??
			answers.MINIO_ROOT_PASSWORD ??
			process.env.MINIO_ROOT_PASSWORD ??
			"password";
		answers.MINIO_ROOT_PASSWORD = await promptInput(
			"MINIO_ROOT_PASSWORD",
			"Minio root password:",
			minioPasswordDefault,
		);
		// Sync back to API_MINIO_SECRET_KEY if it was set
		if (answers.API_MINIO_SECRET_KEY !== undefined) {
			if (answers.MINIO_ROOT_PASSWORD !== answers.API_MINIO_SECRET_KEY) {
				// User changed MINIO_ROOT_PASSWORD, update API_MINIO_SECRET_KEY to match
				answers.API_MINIO_SECRET_KEY = answers.MINIO_ROOT_PASSWORD;
				process.env.MINIO_ROOT_PASSWORD = answers.MINIO_ROOT_PASSWORD;
				console.log(
					"ℹ️  API_MINIO_SECRET_KEY updated to match MINIO_ROOT_PASSWORD",
				);
			}
		} else {
			// No API_MINIO_SECRET_KEY set yet, set it now
			answers.API_MINIO_SECRET_KEY = answers.MINIO_ROOT_PASSWORD;
			process.env.MINIO_ROOT_PASSWORD = answers.MINIO_ROOT_PASSWORD;
		}
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
