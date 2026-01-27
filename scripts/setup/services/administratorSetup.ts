import { promptInput } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";
import { validateEmail } from "../validators.js";

/**
 * Prompt for the administrator email and store it in setup answers.
 *
 * @param answers - Accumulated setup answers.
 * @returns Updated answers with API_ADMINISTRATOR_USER_EMAIL_ADDRESS.
 */
export async function administratorEmail(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = await promptInput(
		"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
		"Enter email:",
		"administrator@email.com",
		validateEmail,
	);
	return answers;
}
