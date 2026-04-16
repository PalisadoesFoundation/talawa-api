import { promptConfirm, promptInput, promptList } from "../promptHelpers";
import { generateJwtSecret, validatePositiveInteger } from "../validators";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

export async function restAuthSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		console.log("\n--- REST Authentication Configuration ---");
		console.log(
			"Configure environment variables for REST auth (signin, refresh, logout).",
		);
		console.log("See docs/getting-started/rest-auth.md for details.");
		console.log();

		const authJwtSecret = generateJwtSecret();
		answers.API_AUTH_JWT_SECRET = await promptInput(
			"API_AUTH_JWT_SECRET",
			"REST auth JWT secret (min 32 characters):",
			authJwtSecret,
			(input: string) => {
				const trimmed = input.trim();
				if (trimmed.length < 32) {
					return "REST auth JWT secret must be at least 32 characters.";
				}
				return true;
			},
		);

		answers.API_ACCESS_TOKEN_TTL = await promptInput(
			"API_ACCESS_TOKEN_TTL",
			"Access token TTL in seconds (default 900):",
			"900",
			validatePositiveInteger,
		);

		answers.API_REFRESH_TOKEN_TTL = await promptInput(
			"API_REFRESH_TOKEN_TTL",
			"Refresh token TTL in seconds (default 2592000):",
			"2592000",
			validatePositiveInteger,
		);

		const cookieSecret = generateJwtSecret();
		answers.API_COOKIE_SECRET = await promptInput(
			"API_COOKIE_SECRET",
			"Cookie signing secret (min 32 characters):",
			cookieSecret,
			(input: string) => {
				const trimmed = input.trim();
				if (trimmed.length < 32) {
					return "Cookie secret must be at least 32 characters.";
				}
				return true;
			},
		);

		const setCookieDomain = await promptConfirm(
			"setCookieDomain",
			"Set cookie domain for cross-subdomain auth?",
			false,
		);
		if (setCookieDomain) {
			const domainInput = await promptInput(
				"API_COOKIE_DOMAIN",
				"Cookie domain (e.g. .example.com):",
				"",
				(input: string) => {
					const trimmed = input.trim();
					if (trimmed.length === 0) {
						return "Cookie domain cannot be empty.";
					}
					const domainPattern =
						/^(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*)$/;
					if (!domainPattern.test(trimmed)) {
						return "Enter a valid domain (e.g. .example.com or example.com).";
					}
					return true;
				},
			);
			answers.API_COOKIE_DOMAIN = domainInput?.trim() ?? "";
		}

		answers.API_IS_SECURE_COOKIES = await promptList(
			"API_IS_SECURE_COOKIES",
			"Use secure (HTTPS-only) cookies?",
			["true", "false"],
			"false",
		);

		console.log("\nREST auth configuration completed!");
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
