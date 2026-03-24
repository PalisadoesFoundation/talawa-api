import { promptInput, promptList } from "scripts/setup/promptHelpers";
import { validatePositiveInteger } from "scripts/setup/validators";
import {
	handlePromptError,
	type SetupAnswers,
} from "scripts/setup/services/sharedSetup";

export async function cachingSetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		const enableWarming = await promptList(
			"enableWarming",
			"Enable cache warming at startup?",
			["true", "false"],
			"false",
		);

		if (enableWarming === "true") {
			answers.CACHE_WARMING_ORG_COUNT = await promptInput(
				"CACHE_WARMING_ORG_COUNT",
				"Number of top organizations to warm (by member count):",
				"10",
				validatePositiveInteger,
			);
		} else {
			answers.CACHE_WARMING_ORG_COUNT = "0";
		}

		return answers;
	} catch (err) {
		console.error(err);
		await handlePromptError(err);
		throw err;
	}
}