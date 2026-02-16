import { promptList } from "../promptHelpers";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

export async function setCI(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.CI = await promptList("CI", "Set CI:", ["true", "false"], "false");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
