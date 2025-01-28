import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { administratorEmail } from "~/src/setup";

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
		console.log(process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS);

		expect(process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS).toBe(mockedEmail);
	});
});
