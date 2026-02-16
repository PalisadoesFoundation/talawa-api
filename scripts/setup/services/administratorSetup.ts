import { promptInput } from "../promptHelpers";
import { validateEmail } from "../validators";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

export async function administratorEmail(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = await promptInput(
			"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			"Enter administrator user email address:",
			"administrator@email.com",
			validateEmail,
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
