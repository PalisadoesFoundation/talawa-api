import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { administratorEmail } from "~/src/setup";
import { validateEmail } from "~/src/setup";

vi.mock("inquirer");

describe("Setup -> askForAdministratorEmail", () => {
	const originalEmail = process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;

	afterEach(() => {
		process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = originalEmail;
	});

	it("should prompt the user for an email and update the email env", async () => {
		const mockedEmail = "testuser@email.com";

		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: mockedEmail,
		});

		await administratorEmail();

		expect(process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS).toBe(mockedEmail);
	});

	it("should return true for valid email addresses", () => {
		expect(validateEmail("user@example.com")).toBe(true);
		expect(validateEmail("test.email@domain.io")).toBe(true);
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
});
