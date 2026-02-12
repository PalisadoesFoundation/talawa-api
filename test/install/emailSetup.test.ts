import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailSetup } from "../../scripts/setup/emailSetup";
import * as promptHelpers from "../../scripts/setup/promptHelpers";
import type { SetupAnswers } from "../../scripts/setup/setup";

// Mutable mock for SESProvider to allow per-test behavior control
const mocks = vi.hoisted(() => ({
	mockSendEmail: vi.fn(),
	mockSESProviderConstructor: vi.fn(),
	mockSMTPSendEmail: vi.fn(),
	mockSMTPProviderConstructor: vi.fn(),
}));

// Mock the prompt helpers
vi.mock("../../scripts/setup/promptHelpers", () => ({
	promptConfirm: vi.fn(),
	promptInput: vi.fn(),
	promptList: vi.fn(),
	promptPassword: vi.fn(),
}));

// Mock SESProvider and SMTPProvider at module level
vi.mock("../../src/services/email", () => ({
	SESProvider: vi.fn().mockImplementation((...args) => {
		mocks.mockSESProviderConstructor(...args);
		return {
			sendEmail: (...callArgs: unknown[]) => mocks.mockSendEmail(...callArgs),
		};
	}),
	SMTPProvider: vi.fn().mockImplementation((...args) => {
		mocks.mockSMTPProviderConstructor(...args);
		return {
			sendEmail: (...callArgs: unknown[]) =>
				mocks.mockSMTPSendEmail(...callArgs),
		};
	}),
}));

describe("emailSetup", () => {
	let answers: SetupAnswers;

	// Track console spies to restore them individually
	let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

	beforeEach(() => {
		answers = {};
		vi.clearAllMocks();

		// Reset prompt mocks
		vi.mocked(promptHelpers.promptConfirm).mockReset();
		vi.mocked(promptHelpers.promptList).mockReset();
		vi.mocked(promptHelpers.promptInput).mockReset();
		vi.mocked(promptHelpers.promptPassword).mockReset();

		// Reset mock behavior to a default (e.g., success)
		mocks.mockSendEmail.mockReset().mockResolvedValue({
			success: true,
			messageId: "test-message-id",
		});
		mocks.mockSESProviderConstructor.mockReset();

		// Reset SMTP mocks as well
		mocks.mockSMTPSendEmail.mockReset().mockResolvedValue({
			success: true,
			messageId: "test-smtp-message-id",
		});
		mocks.mockSMTPProviderConstructor.mockReset();
	});

	afterEach(() => {
		if (consoleErrorSpy) {
			consoleErrorSpy.mockRestore();
			consoleErrorSpy = undefined;
		}
	});

	it("should auto-configure Mailpit if user declines manual configuration", async () => {
		vi.mocked(promptHelpers.promptConfirm).mockResolvedValueOnce(false);

		const result = await emailSetup(answers);

		expect(promptHelpers.promptConfirm).toHaveBeenCalledWith(
			"useManualEmail",
			"Do you want to manually configure email (AWS SES or SMTP)?",
			false,
		);
		expect(promptHelpers.promptList).not.toHaveBeenCalled();
		expect(result.API_EMAIL_PROVIDER).toBe("mailpit");
		expect(result.API_SMTP_HOST).toBe("mailpit");
		expect(result.API_SMTP_PORT).toBe("1025");
		expect(result.API_SMTP_FROM_EMAIL).toBe("test@talawa.local");
		expect(result.API_SMTP_FROM_NAME).toBe("Talawa");
	});

	it("should configure SES and send test email successfully", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true); // Send test email? Yes

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses"); // Provider: SES

		// SES Prompts
		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1") // Region
			.mockResolvedValueOnce("access-key") // Access Key
			.mockResolvedValueOnce("test@example.com") // From Email
			.mockResolvedValueOnce("Test App") // From Name
			.mockResolvedValueOnce("recipient@example.com"); // Test recipient

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce("secret-key"); // Secret Key

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: true,
			messageId: "test-message-id-123",
		});

		const result = await emailSetup(answers);

		// Assert credentials preserved
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.API_AWS_SES_REGION).toBe("us-east-1");
		expect(result.API_AWS_ACCESS_KEY_ID).toBe("access-key");
		expect(result.API_AWS_SECRET_ACCESS_KEY).toBe("secret-key");
		expect(result.API_AWS_SES_FROM_EMAIL).toBe("test@example.com");
		expect(result.API_AWS_SES_FROM_NAME).toBe("Test App");

		// Assert successful mock usage
		expect(mocks.mockSendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "recipient@example.com",
				subject: expect.stringContaining("Test Email"),
			}),
		);

		// Verify no failure action was prompted
		expect(promptHelpers.promptList).toHaveBeenCalledTimes(1); // Only for provider selection
	});

	it("should configure SES but skip test email if requested", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(false); // Send test email? No

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses"); // Provider: SES

		// SES Prompts
		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1") // Region
			.mockResolvedValueOnce("access-key") // Access Key
			.mockResolvedValueOnce("test@example.com") // From Email
			.mockResolvedValueOnce("Test App"); // From Name

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce("secret-key"); // Secret Key

		const result = await emailSetup(answers);

		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.API_AWS_SES_REGION).toBe("us-east-1");
		expect(result.API_AWS_ACCESS_KEY_ID).toBe("access-key");
		expect(result.API_AWS_SECRET_ACCESS_KEY).toBe("secret-key");
		expect(result.API_AWS_SES_FROM_EMAIL).toBe("test@example.com");
		expect(result.API_AWS_SES_FROM_NAME).toBe("Test App");

		// Assert mock was not called
		expect(mocks.mockSendEmail).not.toHaveBeenCalled();
	});

	it("should show error when credentials are missing", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true) // Send test email? Yes (to trigger check)
			.mockResolvedValueOnce(true); // Continue without test? Yes (new prompt)

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses"); // Provider: SES

		// Return empty strings for required fields to trigger validation failure
		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("") // Region (Missing)
			.mockResolvedValueOnce("") // Access Key (Missing)
			.mockResolvedValueOnce("") // From Email (Missing)
			.mockResolvedValueOnce("Test App"); // From Name

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce(""); // Secret Key (Missing)

		// Mock error logging
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const result = await emailSetup(answers);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Cannot send test email"),
		);
		expect(result.API_EMAIL_PROVIDER).toBe("ses"); // Should still return partial config when user continues
	});

	it("should clear config when user declines to continue without test", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true) // Send test email? Yes
			.mockResolvedValueOnce(false); // Continue without test? No

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses");

		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("") // Missing region
			.mockResolvedValueOnce("") // Missing access key
			.mockResolvedValueOnce("") // Missing email
			.mockResolvedValueOnce("Test App"); // From Name

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce(""); // Missing secret

		const result = await emailSetup(answers);

		// All email config should be cleared
		expect(result.API_EMAIL_PROVIDER).toBeUndefined();
		expect(result.API_AWS_SES_REGION).toBeUndefined();
		expect(result.API_AWS_ACCESS_KEY_ID).toBeUndefined();
	});

	it("should retry setup when user chooses retry after test failure", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true) // Send test email? Yes (First attempt)
			.mockResolvedValueOnce(true); // Retry action triggers re-send? (Wait, actually emailSetup calls promptConfirm only for "sendTestEmail")
		// The loop logic:
		// 1. promptConfirm("configureEmail") -> true
		// 2. promptList("API_EMAIL_PROVIDER") -> ses
		// ... inputs ...
		// 3. promptConfirm("sendTestEmail") -> true
		// ... fail ...
		// 4. promptList("testFailureAction") -> Retry
		// ... loop back ...
		// 5. promptList("API_EMAIL_PROVIDER") -> ses
		// ... inputs ...
		// 6. promptConfirm("sendTestEmail") -> true (Retry attempt)

		// So we need:
		// 1. configureEmail (once)
		// 2. sendTestEmail (first attempt)
		// 3. sendTestEmail (second attempt)
		vi.mocked(promptHelpers.promptList)
			.mockResolvedValueOnce("ses") // Provider (First attempt)
			.mockResolvedValueOnce("Retry with different credentials") // Action (First failure)
			.mockResolvedValueOnce("ses"); // Provider (Retry loop)

		// First attempt inputs (fail)
		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("bad-key")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com")
			// Second attempt inputs (succeed)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("good-key")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		vi.mocked(promptHelpers.promptPassword)
			.mockResolvedValueOnce("bad-secret") // First attempt
			.mockResolvedValueOnce("good-secret"); // Second attempt

		// Mock EmailService to fail first then succeed
		mocks.mockSendEmail
			.mockResolvedValueOnce({
				success: false,
				error: "Invalid credentials",
			}) // First fail
			.mockResolvedValueOnce({
				success: true,
				messageId: "test-id",
			}); // Second succeed

		const result = await emailSetup(answers);

		// Should have final successful values
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.API_AWS_ACCESS_KEY_ID).toBe("good-key");

		// Verify mocks were used
		expect(mocks.mockSendEmail).toHaveBeenCalledTimes(2);
	});

	it("should log specific AWS error details when sendEmail throws", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true); // Send test email? Yes

		vi.mocked(promptHelpers.promptList)
			.mockResolvedValueOnce("ses") // Provider
			.mockResolvedValueOnce("Cancel email setup"); // Cancel after error

		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("key")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce("secret");

		// Mock Error with specific AWS-like properties
		const awsError = new Error("SignatureDoesNotMatch") as Error & {
			code?: string;
			name?: string;
		};
		awsError.code = "SignatureDoesNotMatch";
		awsError.name = "SignatureDoesNotMatch";

		mocks.mockSendEmail.mockRejectedValueOnce(awsError);

		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await emailSetup(answers);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error Details: SignatureDoesNotMatch"),
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Code: SignatureDoesNotMatch"),
		);
	});

	it("should clear config when user chooses cancel after test failure", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true); // Send test email? Yes

		vi.mocked(promptHelpers.promptList)
			.mockResolvedValueOnce("ses") // Provider
			.mockResolvedValueOnce("Cancel email setup"); // Test failure action

		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("bad-key")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce("bad-secret");

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: false,
			error: "Some error",
		});

		const result = await emailSetup(answers);

		// All email config should be cleared when user cancels
		expect(result.API_EMAIL_PROVIDER).toBeUndefined();
		expect(result.API_AWS_SES_REGION).toBeUndefined();
		expect(mocks.mockSendEmail).toHaveBeenCalled();
	});

	it("should keep config when user chooses continue anyway after test failure", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true); // Send test email? Yes

		vi.mocked(promptHelpers.promptList)
			.mockResolvedValueOnce("ses") // Provider
			.mockResolvedValueOnce("Continue anyway (save current credentials)"); // Test failure action

		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("bad-key")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce("bad-secret");

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: false,
			error: "Verification failed",
		});

		const result = await emailSetup(answers);

		// Config should be kept when user explicitly continues
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.API_AWS_SES_REGION).toBe("us-east-1");
		expect(result.API_AWS_ACCESS_KEY_ID).toBe("bad-key");
		expect(mocks.mockSendEmail).toHaveBeenCalled();
	});

	it("should verify SESProvider instantiation and sendEmail parameters", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure
			.mockResolvedValueOnce(true); // Send test

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses");

		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1") // Region
			.mockResolvedValueOnce("access") // Key
			.mockResolvedValueOnce("from@example.com") // From Email
			.mockResolvedValueOnce("App") // From Name
			.mockResolvedValueOnce("recipient@example.com"); // Recipient

		vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce("secret"); // Secret

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: true,
			messageId: "abc",
		});

		await emailSetup(answers);

		// Verify constructor arguments
		expect(mocks.mockSESProviderConstructor).toHaveBeenCalledWith({
			region: "us-east-1",
			accessKeyId: "access",
			secretAccessKey: "secret",
			fromEmail: "from@example.com",
			fromName: "App",
		});

		// Verify sendEmail parameters
		expect(mocks.mockSendEmail).toHaveBeenCalledWith({
			id: expect.any(String),
			email: "recipient@example.com",
			subject: "Talawa API - Test Email",
			htmlBody: expect.stringContaining("It Works!"),
			userId: null,
		});
	});

	it("should exercise validateEmail with invalid input", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure
			.mockResolvedValueOnce(false); // Skip test

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses");

		// The validateEmail function is passed to promptInput.
		// We'll capture it and call it directly.
		vi.mocked(promptHelpers.promptInput).mockImplementation(
			async (name, _message, defaultValue, validator) => {
				if (name === "API_AWS_SES_FROM_EMAIL" && validator) {
					// Test invalid email
					expect(validator("invalid-email")).toBe(
						"Invalid email format. Please enter a valid email address.",
					);
					// Test valid email
					expect(validator("valid@example.com")).toBe(true);
				}
				return defaultValue || "some-value";
			},
		);

		await emailSetup(answers);

		expect(promptHelpers.promptInput).toHaveBeenCalledWith(
			"API_AWS_SES_FROM_EMAIL",
			expect.any(String),
			"",
			expect.any(Function),
		);
	});

	it("should exercise AWS credential validators", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure
			.mockResolvedValueOnce(false); // Skip test

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses");

		// Capture validators for Region and Keys
		vi.mocked(promptHelpers.promptInput).mockImplementation(
			async (name, _message, defaultValue, validator) => {
				if (name === "API_AWS_SES_REGION" && validator) {
					// Empty
					expect(validator("")).toBe("AWS SES Region is required");
					// Invalid format
					expect(validator("invalid")).toBe(
						"Invalid region format. Expected format: us-east-1, us-gov-east-1, us-iso-east-1, etc.",
					);
					// Valid format
					expect(validator("us-east-1")).toBe(true);
				}
				if (name === "API_AWS_ACCESS_KEY_ID" && validator) {
					expect(validator("")).toBe(
						"AWS Access Key ID is required for SES configuration",
					);
					expect(validator("some-key")).toBe(true);
				}
				return defaultValue || "some-value";
			},
		);

		// Also check Secret Key validator which is in promptPassword
		vi.mocked(promptHelpers.promptPassword).mockImplementation(
			async (name, _message, validator) => {
				if (name === "API_AWS_SECRET_ACCESS_KEY" && validator) {
					expect(validator("")).toBe(
						"AWS Secret Access Key is required for SES configuration",
					);
					expect(validator("some-secret")).toBe(true);
				}
				return "some-secret";
			},
		);

		await emailSetup(answers);

		// Ensure we actually hit these checks
		expect(promptHelpers.promptInput).toHaveBeenCalledWith(
			"API_AWS_SES_REGION",
			expect.any(String),
			expect.any(String),
			expect.any(Function),
		);
	});

	it("should propagate errors", async () => {
		const error = new Error("Prompt failed");
		vi.mocked(promptHelpers.promptConfirm).mockRejectedValueOnce(error);

		await expect(emailSetup(answers)).rejects.toThrow("Prompt failed");
	});

	// SMTP Provider Tests
	describe("SMTP Provider", () => {
		it("should configure SMTP and send test email successfully", async () => {
			vi.mocked(promptHelpers.promptConfirm)
				.mockResolvedValueOnce(true) // Configure email? Yes
				.mockResolvedValueOnce(true) // Requires auth? Yes
				.mockResolvedValueOnce(false) // Use SSL/TLS? No (port 587)
				.mockResolvedValueOnce(true); // Send test email? Yes

			vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("smtp"); // Provider: SMTP

			// SMTP Prompts
			vi.mocked(promptHelpers.promptInput)
				.mockResolvedValueOnce("smtp.gmail.com") // Host
				.mockResolvedValueOnce("587") // Port
				.mockResolvedValueOnce("user@gmail.com") // User
				.mockResolvedValueOnce("from@example.com") // From Email
				.mockResolvedValueOnce("Test App") // From Name
				.mockResolvedValueOnce("client.hostname") // SMTP Name
				.mockResolvedValueOnce("192.168.1.100") // Local Address
				.mockResolvedValueOnce("recipient@example.com"); // Test recipient

			vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce(
				"app-password",
			); // Password

			mocks.mockSMTPSendEmail.mockResolvedValueOnce({
				success: true,
				messageId: "smtp-test-id",
			});

			const result = await emailSetup(answers);

			// Assert credentials preserved
			expect(result.API_EMAIL_PROVIDER).toBe("smtp");
			expect(result.API_SMTP_HOST).toBe("smtp.gmail.com");
			expect(result.API_SMTP_PORT).toBe("587");
			expect(result.SMTP_USER).toBe("user@gmail.com");
			expect(result.SMTP_PASSWORD).toBe("app-password");
			expect(result.SMTP_SECURE).toBe("false");
			expect(result.API_SMTP_FROM_EMAIL).toBe("from@example.com");
			expect(result.API_SMTP_FROM_NAME).toBe("Test App");
			expect(result.SMTP_NAME).toBe("client.hostname");
			expect(result.SMTP_LOCAL_ADDRESS).toBe("192.168.1.100");

			// Assert successful mock usage
			expect(mocks.mockSMTPSendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "recipient@example.com",
					subject: expect.stringContaining("Test Email"),
				}),
			);
		});

		it("should configure SMTP without authentication", async () => {
			vi.mocked(promptHelpers.promptConfirm)
				.mockResolvedValueOnce(true) // Configure email? Yes
				.mockResolvedValueOnce(false) // Requires auth? No
				.mockResolvedValueOnce(false) // Use SSL/TLS? No
				.mockResolvedValueOnce(false); // Send test email? No

			vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("smtp");

			vi.mocked(promptHelpers.promptInput)
				.mockResolvedValueOnce("localhost") // Host
				.mockResolvedValueOnce("25") // Port
				.mockResolvedValueOnce("from@localhost") // From Email
				.mockResolvedValueOnce("Local") // From Name
				.mockResolvedValueOnce("") // SMTP Name
				.mockResolvedValueOnce(""); // Local Address

			const result = await emailSetup(answers);

			expect(result.API_EMAIL_PROVIDER).toBe("smtp");
			expect(result.API_SMTP_HOST).toBe("localhost");
			expect(result.SMTP_USER).toBeUndefined();
			expect(result.SMTP_PASSWORD).toBeUndefined();
			expect(result.SMTP_NAME).toBeUndefined();
			expect(result.SMTP_LOCAL_ADDRESS).toBeUndefined();
		});

		it("should treat whitespace-only SMTP optional fields as undefined", async () => {
			vi.mocked(promptHelpers.promptConfirm)
				.mockResolvedValueOnce(true) // Configure email
				.mockResolvedValueOnce(false) // Auth
				.mockResolvedValueOnce(false) // SSL
				.mockResolvedValueOnce(false); // Test email

			vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("smtp");

			vi.mocked(promptHelpers.promptInput)
				.mockResolvedValueOnce("localhost")
				.mockResolvedValueOnce("25")
				.mockResolvedValueOnce("from@localhost")
				.mockResolvedValueOnce("Local")
				.mockResolvedValueOnce("   ") // Whitespace SMTP Name
				.mockResolvedValueOnce("\t"); // Whitespace Local Address

			const result = await emailSetup(answers);

			expect(result.SMTP_NAME).toBeUndefined();
			expect(result.SMTP_LOCAL_ADDRESS).toBeUndefined();
		});

		it("should retry SMTP setup when test fails", async () => {
			vi.mocked(promptHelpers.promptConfirm)
				.mockResolvedValueOnce(true) // Configure email? Yes
				.mockResolvedValueOnce(true) // Requires auth? Yes (first)
				.mockResolvedValueOnce(false) // Use SSL? No
				.mockResolvedValueOnce(true) // Send test? Yes (first)
				.mockResolvedValueOnce(true) // Requires auth? Yes (retry)
				.mockResolvedValueOnce(false) // Use SSL? No (retry)
				.mockResolvedValueOnce(true); // Send test? Yes (retry)

			vi.mocked(promptHelpers.promptList)
				.mockResolvedValueOnce("smtp") // Provider (first)
				.mockResolvedValueOnce("Retry with different credentials") // Action after failure
				.mockResolvedValueOnce("smtp"); // Provider (retry)

			vi.mocked(promptHelpers.promptInput)
				// First attempt
				.mockResolvedValueOnce("smtp.bad.com")
				.mockResolvedValueOnce("587")
				.mockResolvedValueOnce("bad@example.com")
				.mockResolvedValueOnce("from@example.com")
				.mockResolvedValueOnce("App")
				.mockResolvedValueOnce("my-hostname")
				.mockResolvedValueOnce("10.0.0.5")
				.mockResolvedValueOnce("test@example.com")
				// Retry attempt
				.mockResolvedValueOnce("smtp.good.com")
				.mockResolvedValueOnce("587")
				.mockResolvedValueOnce("good@example.com")
				.mockResolvedValueOnce("from@example.com")
				.mockResolvedValueOnce("App")
				.mockResolvedValueOnce("my-hostname")
				.mockResolvedValueOnce("10.0.0.5")
				.mockResolvedValueOnce("test@example.com");

			vi.mocked(promptHelpers.promptPassword)
				.mockResolvedValueOnce("bad-pass")
				.mockResolvedValueOnce("good-pass");

			mocks.mockSMTPSendEmail
				.mockResolvedValueOnce({
					success: false,
					error: "Connection refused",
				})
				.mockResolvedValueOnce({
					success: true,
					messageId: "success-id",
				});

			const result = await emailSetup(answers);

			expect(result.API_SMTP_HOST).toBe("smtp.good.com");
			expect(result.SMTP_USER).toBe("good@example.com");
			expect(mocks.mockSMTPSendEmail).toHaveBeenCalledTimes(2);
		});

		it("should verify SMTPProvider instantiation parameters", async () => {
			vi.mocked(promptHelpers.promptConfirm)
				.mockResolvedValueOnce(true) // Configure
				.mockResolvedValueOnce(true) // Auth
				.mockResolvedValueOnce(true) // SSL (port 465)
				.mockResolvedValueOnce(true); // Test email

			vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("smtp");

			vi.mocked(promptHelpers.promptInput)
				.mockResolvedValueOnce("smtp.example.com")
				.mockResolvedValueOnce("465")
				.mockResolvedValueOnce("user@example.com")
				.mockResolvedValueOnce("from@example.com")
				.mockResolvedValueOnce("App Name")
				.mockResolvedValueOnce("client.hostname") // SMTP Name
				.mockResolvedValueOnce("192.168.1.100") // Local Address
				.mockResolvedValueOnce("recipient@example.com");

			vi.mocked(promptHelpers.promptPassword).mockResolvedValueOnce(
				"password123",
			);

			mocks.mockSMTPSendEmail.mockResolvedValueOnce({
				success: true,
				messageId: "test-id",
			});

			await emailSetup(answers);

			// Verify constructor was called with correct config
			expect(mocks.mockSMTPProviderConstructor).toHaveBeenCalledWith({
				host: "smtp.example.com",
				port: 465,
				user: "user@example.com",
				password: "password123",
				secure: true,
				fromEmail: "from@example.com",
				fromName: "App Name",
				name: "client.hostname",
				localAddress: "192.168.1.100",
			});

			// Verify sendEmail was called
			expect(mocks.mockSMTPSendEmail).toHaveBeenCalledWith({
				id: expect.any(String),
				email: "recipient@example.com",
				subject: "Talawa API - Test Email",
				htmlBody: expect.stringContaining("It Works!"),
				userId: null,
			});
		});
	});
});
