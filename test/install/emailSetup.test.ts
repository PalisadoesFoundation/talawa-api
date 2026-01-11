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
			.mockResolvedValueOnce(true); // Send test email? Yes (to trigger check)

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
		expect(result.API_EMAIL_PROVIDER).toBe("ses"); // Should still return partial config
	});

	it("should propagate errors", async () => {
		const error = new Error("Prompt failed");
		vi.mocked(promptHelpers.promptConfirm).mockRejectedValueOnce(error);

		await expect(emailSetup(answers)).rejects.toThrow("Prompt failed");
	});
});
