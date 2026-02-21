import { promptInput } from "../promptHelpers";
import { validateEmail, validatePort } from "../validators";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

export async function caddySetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		answers.CADDY_HTTP_MAPPED_PORT = await promptInput(
			"CADDY_HTTP_MAPPED_PORT",
			"Caddy HTTP mapped port:",
			"80",
			validatePort,
		);
		answers.CADDY_HTTPS_MAPPED_PORT = await promptInput(
			"CADDY_HTTPS_MAPPED_PORT",
			"Caddy HTTPS mapped port:",
			"443",
			validatePort,
		);
		answers.CADDY_HTTP3_MAPPED_PORT = await promptInput(
			"CADDY_HTTP3_MAPPED_PORT",
			"Caddy HTTP3 mapped port:",
			"443",
			validatePort,
		);
		answers.CADDY_TALAWA_API_DOMAIN_NAME = await promptInput(
			"CADDY_TALAWA_API_DOMAIN_NAME",
			"Caddy Talawa API domain name:",
			"localhost",
		);
		answers.CADDY_TALAWA_API_EMAIL = await promptInput(
			"CADDY_TALAWA_API_EMAIL",
			"Caddy Talawa API email:",
			"talawa@email.com",
			validateEmail,
		);
		answers.CADDY_TALAWA_API_HOST = await promptInput(
			"CADDY_TALAWA_API_HOST",
			"Caddy Talawa API host:",
			"api",
		);
		answers.CADDY_TALAWA_API_PORT = await promptInput(
			"CADDY_TALAWA_API_PORT",
			"Caddy Talawa API port:",
			"4000",
			validatePort,
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
