import { promptInput } from "../promptHelpers";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";

export async function reCaptchaSetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		answers.RECAPTCHA_SECRET_KEY = await promptInput(
			"RECAPTCHA_SECRET_KEY",
			"Enter Google reCAPTCHA v3 Secret Key:",
			"",
			(input: string) => {
				if (input.trim().length < 1) {
					return "reCAPTCHA Secret Key cannot be empty.";
				}
				return true;
			},
		);

		answers.RECAPTCHA_SCORE_THRESHOLD = await promptInput(
			"RECAPTCHA_SCORE_THRESHOLD",
			"Enter reCAPTCHA v3 score threshold (0.0-1.0, higher = more human-like, default: 0.5):",
			"0.5",
			(input: string) => {
				const score = parseFloat(input.trim());
				if (Number.isNaN(score)) {
					return "Score threshold must be a valid number.";
				}
				if (score < 0.0 || score > 1.0) {
					return "Score threshold must be between 0.0 and 1.0.";
				}
				return true;
			},
		);
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
