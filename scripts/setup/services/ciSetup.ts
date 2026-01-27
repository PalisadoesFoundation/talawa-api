import { promptList } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";

/**
 * Prompt for CI configuration.
 *
 * @param answers - Accumulated setup answers.
 * @returns Updated answers with CI setting.
 */
export async function setCI(answers: SetupAnswers): Promise<SetupAnswers> {
	answers.CI = await promptList("CI", "Set CI:", ["true", "false"], "false");
	return answers;
}
