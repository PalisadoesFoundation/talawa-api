import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailSetup } from "../../scripts/setup/emailSetup";
import * as promptHelpers from "../../scripts/setup/promptHelpers";

// Local mock interface to avoid importing from setup.ts (which has side effects)
interface SetupAnswers {
	[key: string]: string | undefined;
}

// Mock the prompt helpers
// NOTE: Unit tests are intentional here for pure setup logic validation.
// Integration tests (mercuriusClient) should be used if this script begins interacting with the API/DB layers.
vi.mock("../../scripts/setup/promptHelpers", () => ({
	promptConfirm: vi.fn(),
	promptInput: vi.fn(),
	promptList: vi.fn(),
}));

describe("emailSetup", () => {
	let answers: SetupAnswers;

	beforeEach(() => {
		answers = {};
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

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

	it("should configure SES when selected", async () => {
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

		expect(promptHelpers.promptList).toHaveBeenCalledWith(
			"API_EMAIL_PROVIDER",
			"Select email provider:",
			["ses"],
			"ses",
		);

		// Verify Test Email Prompt
		expect(promptHelpers.promptConfirm).toHaveBeenCalledWith(
			"sendTestEmail",
			expect.stringContaining("Do you want to send a test email now?"),
			false,
		);
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
		const _consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const result = await emailSetup(answers);

		expect(_consoleErrorSpy).toHaveBeenCalledWith(
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

		// Mock EmailService
		const mockEmailService = {
			sendEmail: vi
				.fn()
				.mockResolvedValueOnce({
					success: false,
					error: "Invalid credentials",
				}) // First fail
				.mockResolvedValueOnce({
					success: true,
					messageId: "test-id",
				}), // Second succeed
		};

		vi.doMock("../../src/services/ses/EmailService", () => ({
			EmailService: vi.fn().mockImplementation(() => mockEmailService),
		}));

		const result = await emailSetup(answers);

		// Should have final successful values
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.AWS_ACCESS_KEY_ID).toBe("good-key");
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

		vi.doMock("../../src/services/ses/EmailService", () => ({
			EmailService: vi.fn().mockImplementation(() => ({
				sendEmail: vi.fn().mockRejectedValue(awsError),
			})),
		}));

		const _consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		// Log spy removed as it was unused

		await emailSetup(answers);

		expect(_consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error Details: SignatureDoesNotMatch"),
		);
		expect(_consoleErrorSpy).toHaveBeenCalledWith(
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

		const result = await emailSetup(answers);

		// All email config should be cleared when user cancels
		expect(result.API_EMAIL_PROVIDER).toBeUndefined();
		expect(result.AWS_SES_REGION).toBeUndefined();
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

		const result = await emailSetup(answers);

		// Config should be kept when user explicitly continues
		expect(result.API_EMAIL_PROVIDER).toBe("ses");
		expect(result.AWS_SES_REGION).toBe("us-east-1");
		expect(result.AWS_ACCESS_KEY_ID).toBe("bad-key");
	});

	it("should propagate errors", async () => {
		const error = new Error("Prompt failed");
		vi.mocked(promptHelpers.promptConfirm).mockRejectedValueOnce(error);

		await expect(emailSetup(answers)).rejects.toThrow("Prompt failed");
	});
});
