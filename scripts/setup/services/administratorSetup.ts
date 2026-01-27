import { validateEmail } from "../validators.js";
import { promptInput } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";

async function handlePromptError(err: unknown): Promise<never> {
    throw err;
}

export async function administratorEmail(
    answers: SetupAnswers,
): Promise<SetupAnswers> {
    try {
        answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = await promptInput(
            "API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
            "Enter email:",
            "administrator@email.com",
            validateEmail,
        );
    } catch (err) {
        await handlePromptError(err);
    }
    return answers;
}
