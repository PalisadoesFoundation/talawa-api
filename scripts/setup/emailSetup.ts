import { promptConfirm, promptInput, promptList } from "./promptHelpers";
import { type SetupAnswers, validateEmail } from "./setup";

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

		answers.EMAIL_PROVIDER = await promptList(
			"EMAIL_PROVIDER",
			"Select email provider:",
			["ses"], // SMTP to be added later
			"ses",
		);

		if (answers.EMAIL_PROVIDER === "ses") {
			answers.AWS_SES_REGION = await promptInput(
				"AWS_SES_REGION",
				"AWS SES Region:",
				"ap-south-1",
			);

			answers.AWS_ACCESS_KEY_ID = await promptInput(
				"AWS_ACCESS_KEY_ID",
				"AWS Access Key ID:",
				"",
			);

			answers.AWS_SECRET_ACCESS_KEY = await promptInput(
				"AWS_SECRET_ACCESS_KEY",
				"AWS Secret Access Key:",
				"",
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
					region: answers.AWS_SES_REGION || process.env.AWS_SES_REGION || "",
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
	} catch (err) {
		console.error("Error during email setup:", err);
		throw err;
	}
	return answers;
}
