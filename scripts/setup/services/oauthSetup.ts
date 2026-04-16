import { promptConfirm, promptInput, promptList } from "../promptHelpers";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

export async function oauthSetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		const providers = await promptList(
			"oauthProviders",
			"Which OAuth providers would you like to configure?",
			[
				"Google OAuth",
				"GitHub OAuth",
				"Both Google and GitHub",
				"Skip OAuth setup",
			],
			"Skip OAuth setup",
		);

		if (providers === "Skip OAuth setup") {
			return answers;
		}

		const setupGoogle =
			providers === "Google OAuth" || providers === "Both Google and GitHub";
		const setupGitHub =
			providers === "GitHub OAuth" || providers === "Both Google and GitHub";

		if (setupGoogle) {
			console.log("\n--- Google OAuth Configuration ---");
			console.log("Get your Google OAuth credentials from:");
			console.log("https://console.developers.google.com/apis/credentials");
			console.log("Make sure to:");
			console.log("1. Create OAuth 2.0 Client ID");
			console.log("2. Add your redirect URI to authorized redirect URIs");
			console.log();

			answers.GOOGLE_CLIENT_ID = await promptInput(
				"GOOGLE_CLIENT_ID",
				"Enter Google OAuth Client ID:",
				answers.GOOGLE_CLIENT_ID,
				(input: string) => {
					if (input.trim().length < 1) {
						return "Google Client ID cannot be empty.";
					}
					return true;
				},
			);

			answers.GOOGLE_CLIENT_SECRET = await promptInput(
				"GOOGLE_CLIENT_SECRET",
				"Enter Google OAuth Client Secret:",
				answers.GOOGLE_CLIENT_SECRET,
				(input: string) => {
					if (input.trim().length < 1) {
						return "Google Client Secret cannot be empty.";
					}
					return true;
				},
			);
		}

		if (setupGitHub) {
			console.log("\n--- GitHub OAuth Configuration ---");
			console.log("Get your GitHub OAuth credentials from:");
			console.log("https://github.com/settings/developers");
			console.log("Make sure to:");
			console.log("1. Create a new OAuth App");
			console.log("2. Set the correct Authorization callback URL");
			console.log();

			answers.GITHUB_CLIENT_ID = await promptInput(
				"GITHUB_CLIENT_ID",
				"Enter GitHub OAuth Client ID:",
				answers.GITHUB_CLIENT_ID,
				(input: string) => {
					if (input.trim().length < 1) {
						return "GitHub Client ID cannot be empty.";
					}
					return true;
				},
			);

			answers.GITHUB_CLIENT_SECRET = await promptInput(
				"GITHUB_CLIENT_SECRET",
				"Enter GitHub OAuth Client Secret:",
				answers.GITHUB_CLIENT_SECRET,
				(input: string) => {
					if (input.trim().length < 1) {
						return "GitHub Client Secret cannot be empty.";
					}
					return true;
				},
			);
		}

		const useDefaultTimeout = await promptConfirm(
			"useDefaultOAuthTimeout",
			"Use recommended default OAuth request timeout settings (10 seconds)?",
			true,
		);

		if (useDefaultTimeout) {
			answers.API_OAUTH_REQUEST_TIMEOUT_MS = "10000";
		} else {
			answers.API_OAUTH_REQUEST_TIMEOUT_MS = await promptInput(
				"API_OAUTH_REQUEST_TIMEOUT_MS",
				"Enter OAuth request timeout in milliseconds:",
				answers.API_OAUTH_REQUEST_TIMEOUT_MS || "10000",
				(input: string) => {
					const timeout = Number.parseInt(input, 10);
					if (Number.isNaN(timeout) || timeout < 1000 || timeout > 60000) {
						return "Timeout must be between 1000 and 60000 milliseconds.";
					}
					return true;
				},
			);
		}

		console.log("\nOAuth provider configuration completed!");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
