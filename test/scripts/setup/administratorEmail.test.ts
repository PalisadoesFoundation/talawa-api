import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import inquirer from "inquirer";
import { administratorEmail } from "scripts/setup/services/administratorSetup";
import { validateEmail } from "scripts/setup/validators";

describe("Setup -> askForAdministratorEmail", () => {
	const originalEmail = process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;

	beforeEach(() => {
		// Ensure clean state
		process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = undefined;
	});

	afterEach(() => {
		process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = originalEmail;
	});

	it("should prompt the user for an email and update the email env", async () => {
		const mockedEmail = "testuser@email.com";

		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: mockedEmail,
		});

		const answers = await administratorEmail({});

		expect(answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS).toBe(mockedEmail);
	});

	it("should return true for valid email addresses", () => {
		expect(validateEmail("user@example.com")).toBe(true);
		expect(validateEmail("test.email@domain.io")).toBe(true);
		expect(validateEmail("user+tag@example.co.uk")).toBe(true);
		expect(validateEmail("user@xn--80ak6aa92e.com")).toBe(true);
	});

	it("should return an error message for invalid email addresses", () => {
		expect(validateEmail("invalid-email")).toBe(
			"Invalid email format. Please enter a valid email address.",
		);
		expect(validateEmail(" ")).toBe("Email cannot be empty.");
		expect(validateEmail(`${"a".repeat(255)}@example.com`)).toBe(
			"Email is too long.",
		);
	});

	it("should handle prompt errors correctly", async () => {
		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(administratorEmail({})).rejects.toThrow("inquirer failure");
	});
});
