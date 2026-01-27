import { promptList } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";

async function handlePromptError(err: unknown): Promise<never> {
	throw err;
}

export async function setCI(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.CI = await promptList("CI", "Set CI:", ["true", "false"], "false");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
