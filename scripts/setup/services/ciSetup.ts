import { promptList } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";

export async function setCI(answers: SetupAnswers): Promise<SetupAnswers> {
	answers.CI = await promptList("CI", "Set CI:", ["true", "false"], "false");
	return answers;
}
