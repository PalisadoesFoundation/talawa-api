import type { NonEmptyString } from "../../src/services/email";
import {
	promptConfirm,
	promptInput,
	promptList,
	promptPassword,
} from "./promptHelpers";
import { type SetupAnswers, validateEmail } from "./setup";

/**
 * Interactive setup for email configuration.
 *
 * Prompts the user to select an email provider (currently supports SES) and configure details.
 * Can optionally send a test email to verify credentials.
 *
 * @param answers - The accumulated setup answers object.
 * @returns The updated SetupAnswers object with email configuration.
 * @remarks This function has side effects: it prompts the user via console and may send a real email if requested.
 */

/**
 * Helper to clear email-related credentials from answers.
 */
function clearEmailCredentials(answers: SetupAnswers): void {
	delete answers.API_EMAIL_PROVIDER;
	delete answers.AWS_SES_REGION;
	delete answers.AWS_ACCESS_KEY_ID;
	delete answers.AWS_SECRET_ACCESS_KEY;
	delete answers.AWS_SES_FROM_EMAIL;
	delete answers.AWS_SES_FROM_NAME;
}

export async function emailSetup(answers: SetupAnswers): Promise<SetupAnswers> {
	try {
		const configureEmail = await promptConfirm(
			"configureEmail",
			"Do you want to configure email? (Required for registration verification)",
			true,
		);

		if (!configureEmail) {
			console.log(
				"⚠️  Email configuration skipped. Email-related features will not work.",
			);
			return answers;
		}

		let credentialsValid = false;

		// Loop to allow retrying credentials
		while (!credentialsValid) {
			answers.API_EMAIL_PROVIDER = await promptList(
				"API_EMAIL_PROVIDER",
				"Select email provider:",
				["ses"], // SMTP to be added later
				"ses",
			);

			if (answers.API_EMAIL_PROVIDER === "ses") {
				answers.AWS_SES_REGION = await promptInput(
					"AWS_SES_REGION",
					"AWS SES Region:",
					"ap-south-1",
					(value) => {
						if (!value || value.trim().length === 0) {
							return "AWS SES Region is required";
						}
						// Validate region format (supports standard, gov, iso, etc.)
						if (!/^[a-z0-9-]+-\d+$/.test(value.toLowerCase().trim())) {
							return "Invalid region format. Expected format: us-east-1, us-gov-east-1, us-iso-east-1, etc.";
						}
						return true;
					},
				);

				answers.AWS_ACCESS_KEY_ID = await promptInput(
					"AWS_ACCESS_KEY_ID",
					"AWS Access Key ID:",
					"",
					(value) => {
						if (!value || value.trim().length === 0) {
							return "AWS Access Key ID is required for SES configuration";
						}
						return true;
					},
				);

				answers.AWS_SECRET_ACCESS_KEY = await promptPassword(
					"AWS_SECRET_ACCESS_KEY",
					"AWS Secret Access Key:",
					(value) => {
						if (!value || value.trim().length === 0) {
							return "AWS Secret Access Key is required for SES configuration";
						}
						return true;
					},
				);

				answers.AWS_SES_FROM_EMAIL = await promptInput(
					"AWS_SES_FROM_EMAIL",
					"From Email Address (must be verified in SES):",
					"",
					validateEmail,
				);

				answers.AWS_SES_FROM_NAME = await promptInput(
					"AWS_SES_FROM_NAME",
					"From Display Name:",
					"Talawa",
				);
			}

			const sendTest = await promptConfirm(
				"sendTestEmail",
				"Do you want to send a test email now? (Verifies credentials)",
				false,
			);

			if (sendTest) {
				// Pre-flight validation for required credentials
				const missingCreds: string[] = [];
				if (!answers.AWS_SES_REGION?.trim())
					missingCreds.push("AWS_SES_REGION");
				if (!answers.AWS_ACCESS_KEY_ID?.trim())
					missingCreds.push("AWS_ACCESS_KEY_ID");
				if (!answers.AWS_SECRET_ACCESS_KEY?.trim())
					missingCreds.push("AWS_SECRET_ACCESS_KEY");
				if (!answers.AWS_SES_FROM_EMAIL?.trim())
					missingCreds.push("AWS_SES_FROM_EMAIL");

				if (missingCreds.length > 0) {
					console.error(
						`❌ Cannot send test email. Missing required credentials: ${missingCreds.join(", ")}`,
					);

					const continueAnyway = await promptConfirm(
						"continueWithoutTest",
						"Continue with email setup without sending test? (Credentials will be saved)",
						false,
					);

					if (!continueAnyway) {
						console.log(
							"⚠️  Email configuration cancelled. No credentials saved.",
						);
						clearEmailCredentials(answers);
						return answers;
					}
					// User chose to continue despite missing credentials
					credentialsValid = true;
				} else {
					const testRecipient = await promptInput(
						"testRecipient",
						"Enter recipient email address:",
						answers.AWS_SES_FROM_EMAIL || "",
						validateEmail,
					);

					console.log("Sending test email...");
					let testSuccess = false;

					try {
						// dynamically import to avoid early instantiation issues or circular deps
						const { SESProvider } = await import("../../src/services/email");

						const service = new SESProvider({
							region: (answers.AWS_SES_REGION || "") as NonEmptyString,
							accessKeyId: answers.AWS_ACCESS_KEY_ID,
							secretAccessKey: answers.AWS_SECRET_ACCESS_KEY,
							fromEmail: answers.AWS_SES_FROM_EMAIL,
							fromName: answers.AWS_SES_FROM_NAME,
						});

						const result = await service.sendEmail({
							id: `test-email-${Date.now()}`,
							email: testRecipient,
							subject: "Talawa API - Test Email",
							htmlBody:
								"<h1>It Works!</h1><p>Your Talawa API email configuration is correct.</p>",
							userId: null,
						});

						if (result.success) {
							console.log(
								`✅ Test email sent successfully! Message ID: ${result.messageId}`,
							);
							testSuccess = true;
							credentialsValid = true;
						} else {
							console.error(`❌ Failed to send test email: ${result.error}`);
							console.log(
								"Please check your credentials and ensure the 'From' address is verified in SES.",
							);
						}
					} catch (err: unknown) {
						const error = err as Error & { code?: string };
						console.error("❌ Error attempting to send test email.");
						console.error(`Error Details: ${error.message}`);
						if (error.code) console.error(`Code: ${error.code}`);
						if (error.name) console.error(`Type: ${error.name}`);
						console.log(
							"Tips: Check AWS_SES_REGION, verify AWS_ACCESS_KEY_ID/SECRET, and ensure AWS_SES_FROM_EMAIL is verified in SES.",
						);
					}

					// If test failed, ask user what to do
					if (!testSuccess) {
						const action = await promptList(
							"testFailureAction",
							"Test email failed. What would you like to do?",
							[
								"Retry with different credentials",
								"Continue anyway (save current credentials)",
								"Cancel email setup",
							],
							"Cancel email setup",
						);

						if (action === "Retry with different credentials") {
							console.log("🔄 Retrying email setup...");
							clearEmailCredentials(answers);
							// Loop continues
						} else if (action === "Cancel email setup") {
							console.log(
								"⚠️  Email configuration cancelled. No credentials saved.",
							);
							clearEmailCredentials(answers);
							return answers;
						} else {
							// "Continue anyway" - credentials will be saved
							console.log(
								"⚠️  Continuing with current credentials. You can fix them later in .env",
							);
							credentialsValid = true;
						}
					}
				}
			} else {
				// User explicitly skipped the test but configured email
				credentialsValid = true;
			}
		}
	} catch (err) {
		console.error("Error during email setup:", err);
		throw err;
	}
	return answers;
}
