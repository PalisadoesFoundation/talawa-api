import { promptConfirm, promptInput, promptList } from "./promptHelpers";
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

			answers.AWS_SECRET_ACCESS_KEY = await promptInput(
				"AWS_SECRET_ACCESS_KEY",
				"AWS Secret Access Key:",
				"",
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
			if (!answers.AWS_SES_REGION) missingCreds.push("AWS_SES_REGION");
			if (!answers.AWS_ACCESS_KEY_ID) missingCreds.push("AWS_ACCESS_KEY_ID");
			if (!answers.AWS_SECRET_ACCESS_KEY)
				missingCreds.push("AWS_SECRET_ACCESS_KEY");
			if (!answers.AWS_SES_FROM_EMAIL) missingCreds.push("AWS_SES_FROM_EMAIL");

			if (missingCreds.length > 0) {
				console.error(
					`❌ Cannot send test email. Missing required credentials: ${missingCreds.join(", ")}`,
				);
			} else {
				const testRecipient = await promptInput(
					"testRecipient",
					"Enter recipient email address:",
					answers.AWS_SES_FROM_EMAIL || "",
					validateEmail,
				);

				console.log("Sending test email...");
				try {
					// dynamically import to avoid early instantiation issues or circular deps
					const { EmailService } = await import(
						"../../src/services/ses/EmailService"
					);

					const service = new EmailService({
						region: answers.AWS_SES_REGION || "",
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
					} else {
						console.error(`❌ Failed to send test email: ${result.error}`);
						console.log(
							"Please check your credentials and ensure the 'From' address is verified in SES.",
						);
					}
				} catch (error) {
					console.error("❌ Error attempting to send test email:", error);
				}
			}
		}
	} catch (err) {
		console.error("Error during email setup:", err);
		throw err;
	}
	return answers;
}
