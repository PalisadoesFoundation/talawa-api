import { beforeEach, describe, expect, it, vi } from "vitest";
import { emailSetup } from "../../scripts/setup/emailSetup";
import * as promptHelpers from "../../scripts/setup/promptHelpers";
import type { SetupAnswers } from "../../scripts/setup/setup";

// Mutable mock for EmailService to allow per-test behavior control
const mocks = vi.hoisted(() => ({
	mockSendEmail: vi.fn(),
	mockEmailServiceConstructor: vi.fn(),
}));

// Mock the prompt helpers
vi.mock("../../scripts/setup/promptHelpers", () => ({
	promptConfirm: vi.fn(),
	promptInput: vi.fn(),
	promptList: vi.fn(),
}));

// Mock EmailService at module level
vi.mock("../../src/services/ses/EmailService", () => ({
	EmailService: vi.fn().mockImplementation((...args) => {
		mocks.mockEmailServiceConstructor(...args);
		return {
			sendEmail: (...callArgs: unknown[]) => mocks.mockSendEmail(...callArgs),
		};
	}),
}));

describe("emailSetup", () => {
	let answers: SetupAnswers;

	beforeEach(() => {
		answers = {};
		vi.clearAllMocks();

		// Reset prompt mocks
		vi.mocked(promptHelpers.promptConfirm).mockReset();
		vi.mocked(promptHelpers.promptList).mockReset();
		vi.mocked(promptHelpers.promptInput).mockReset();

		// Reset mock behavior to a default (e.g., success)
		mocks.mockSendEmail.mockReset().mockResolvedValue({
			success: true,
			messageId: "test-message-id",
		});
		mocks.mockEmailServiceConstructor.mockReset().mockImplementation(() => ({
			sendEmail: mocks.mockSendEmail,
		}));
	});

	// afterEach(() => {
	// 	vi.restoreAllMocks();
	// });

	it("should skip email configuration if user declines", async () => {
		vi.mocked(promptHelpers.promptConfirm).mockResolvedValueOnce(false);

		const result = await emailSetup(answers);

		expect(promptHelpers.promptConfirm).toHaveBeenCalledWith(
			"configureEmail",
			expect.stringContaining("Do you want to configure email"),
			true,
		);
		expect(promptHelpers.promptList).not.toHaveBeenCalled();
		expect(result).toEqual(answers);
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
			.mockResolvedValueOnce("secret-key") // Secret Key
			.mockResolvedValueOnce("test@example.com") // From Email
			.mockResolvedValueOnce("Test App") // From Name
			.mockResolvedValueOnce("recipient@example.com"); // Test recipient

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: true,
			messageId: "test-message-id-123",
		});

		const result = await emailSetup(answers);

		// Assert credentials preserved
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.AWS_SES_REGION).toBe("us-east-1");
		expect(result.AWS_ACCESS_KEY_ID).toBe("access-key");
		expect(result.AWS_SECRET_ACCESS_KEY).toBe("secret-key");
		expect(result.AWS_SES_FROM_EMAIL).toBe("test@example.com");
		expect(result.AWS_SES_FROM_NAME).toBe("Test App");

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
			.mockResolvedValueOnce("secret-key") // Secret Key
			.mockResolvedValueOnce("test@example.com") // From Email
			.mockResolvedValueOnce("Test App"); // From Name

		const result = await emailSetup(answers);

		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.AWS_SES_REGION).toBe("us-east-1");
		expect(result.AWS_ACCESS_KEY_ID).toBe("access-key");
		expect(result.AWS_SECRET_ACCESS_KEY).toBe("secret-key");
		expect(result.AWS_SES_FROM_EMAIL).toBe("test@example.com");
		expect(result.AWS_SES_FROM_NAME).toBe("Test App");

		// Assertion mock NOT called
		expect(mocks.mockSendEmail).not.toHaveBeenCalled();
	});

	// NOTE: Test for "should send test email when requested" is omitted because it requires
	// real AWS SES credentials. The EmailService.sendEmail() functionality is fully covered
	// in test/services/ses/EmailService.test.ts with proper AWS SDK mocking.

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
			.mockResolvedValueOnce("") // Secret Key (Missing)
			.mockResolvedValueOnce("") // From Email (Missing)
			.mockResolvedValueOnce("Test App");

		// Mock error logging
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const result = await emailSetup(answers);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"Cannot send test email. Missing required credentials",
			),
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
			.mockResolvedValueOnce("") // Missing secret
			.mockResolvedValueOnce("") // Missing email
			.mockResolvedValueOnce("Test App");

		const result = await emailSetup(answers);

		// All email config should be cleared
		expect(result.API_EMAIL_PROVIDER).toBeUndefined();
		expect(result.AWS_SES_REGION).toBeUndefined();
		expect(result.AWS_ACCESS_KEY_ID).toBeUndefined();
	});

	it("should retry setup when user chooses retry after test failure", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure email? Yes
			.mockResolvedValueOnce(true) // Send test email? Yes (First attempt)
			.mockResolvedValueOnce(true) // Configure email? Yes (Retry loop)
			.mockResolvedValueOnce(true); // Send test email? Yes (Second attempt)

		vi.mocked(promptHelpers.promptList)
			.mockResolvedValueOnce("ses") // Provider (First attempt)
			.mockResolvedValueOnce("Retry with different credentials") // Action (First failure)
			.mockResolvedValueOnce("ses"); // Provider (Retry loop)

		// First attempt inputs (fail)
		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("bad-key")
			.mockResolvedValueOnce("bad-secret")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com")
			// Second attempt inputs (succeed)
			.mockResolvedValueOnce("us-east-1")
			.mockResolvedValueOnce("good-key")
			.mockResolvedValueOnce("good-secret")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

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
		expect(result.AWS_ACCESS_KEY_ID).toBe("good-key");

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
			.mockResolvedValueOnce("secret")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		// Mock Error with specific AWS-like properties
		const awsError = new Error("SignatureDoesNotMatch") as Error & {
			code?: string;
			name?: string;
		};
		awsError.code = "SignatureDoesNotMatch";
		awsError.name = "SignatureDoesNotMatch";

		mocks.mockSendEmail.mockRejectedValueOnce(awsError);

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

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
			.mockResolvedValueOnce("bad-secret")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: false,
			error: "Some error",
		});

		const result = await emailSetup(answers);

		// All email config should be cleared when user cancels
		expect(result.API_EMAIL_PROVIDER).toBeUndefined();
		expect(result.AWS_SES_REGION).toBeUndefined();
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
			.mockResolvedValueOnce("bad-secret")
			.mockResolvedValueOnce("test@example.com")
			.mockResolvedValueOnce("Test App")
			.mockResolvedValueOnce("recipient@example.com");

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: false,
			error: "Verification failed",
		});

		const result = await emailSetup(answers);

		// Config should be kept when user explicitly continues
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.AWS_SES_REGION).toBe("us-east-1");
		expect(result.AWS_ACCESS_KEY_ID).toBe("bad-key");
		expect(mocks.mockSendEmail).toHaveBeenCalled();
	});

	it("should verify EmailService instantiation and sendEmail parameters", async () => {
		vi.mocked(promptHelpers.promptConfirm)
			.mockResolvedValueOnce(true) // Configure
			.mockResolvedValueOnce(true); // Send test

		vi.mocked(promptHelpers.promptList).mockResolvedValueOnce("ses");

		vi.mocked(promptHelpers.promptInput)
			.mockResolvedValueOnce("us-east-1") // Region
			.mockResolvedValueOnce("access") // Key
			.mockResolvedValueOnce("secret") // Secret
			.mockResolvedValueOnce("sender@example.com") // From
			.mockResolvedValueOnce("Sender Name") // Name
			.mockResolvedValueOnce("recipient@example.com"); // Recipient

		mocks.mockSendEmail.mockResolvedValueOnce({
			success: true,
			messageId: "abc",
		});

		await emailSetup(answers);

		// Verify constructor arguments
		expect(mocks.mockEmailServiceConstructor).toHaveBeenCalledWith({
			region: "us-east-1",
			accessKeyId: "access",
			secretAccessKey: "secret",
			fromEmail: "sender@example.com",
			fromName: "Sender Name",
		});

		// Verify sendEmail parameters
		expect(mocks.mockSendEmail).toHaveBeenCalledWith({
			id: expect.stringContaining("test-email-"),
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
				if (name === "AWS_SES_FROM_EMAIL" && validator) {
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
			"AWS_SES_FROM_EMAIL",
			expect.any(String),
			"",
			expect.any(Function),
		);
	});

	it("should propagate errors", async () => {
		const error = new Error("Prompt failed");
		vi.mocked(promptHelpers.promptConfirm).mockRejectedValueOnce(error);

		await expect(emailSetup(answers)).rejects.toThrow("Prompt failed");
	});
});
