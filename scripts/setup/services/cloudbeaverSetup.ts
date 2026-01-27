import { promptInput } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";
import {
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validatePort,
} from "../validators.js";

/**
 * Prompt for CloudBeaver configuration.
 *
 * @param answers - Accumulated setup answers.
 * @returns Updated answers with CloudBeaver settings.
 */
export async function cloudbeaverSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	answers.CLOUDBEAVER_ADMIN_NAME = await promptInput(
		"CLOUDBEAVER_ADMIN_NAME",
		"CloudBeaver admin name:",
		"talawa",
		validateCloudBeaverAdmin,
	);
	answers.CLOUDBEAVER_ADMIN_PASSWORD = await promptInput(
		"CLOUDBEAVER_ADMIN_PASSWORD",
		"CloudBeaver admin password:",
		process.env.CLOUDBEAVER_ADMIN_PASSWORD ?? "",
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
	return answers;
}
