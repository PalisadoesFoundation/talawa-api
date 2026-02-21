import { promptInput, promptList } from "../promptHelpers";
import { validatePositiveInteger } from "../validators";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

/**
 * Sets up caching configuration.
 * Prompts user to configure cache warming settings.
 * @param answers - Current setup answers object
 * @returns Updated answers object with caching configuration
 */
export async function cachingSetup(
    answers: SetupAnswers,
): Promise<SetupAnswers> {
    try {
        console.log("\n--- Caching Configuration ---");
        console.log("Configure caching behavior for your API.");
        console.log();

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

        console.log("\nCaching configuration completed!");
    } catch (err) {
        await handlePromptError(err);
    }
    return answers;
}
