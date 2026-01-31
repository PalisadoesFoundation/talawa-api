import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

vi.mock("inquirer");

vi.mock("env-schema", () => ({
	envSchema: () => ({
		API_GRAPHQL_SCALAR_FIELD_COST: 1,
		API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
		API_GRAPHQL_OBJECT_FIELD_COST: 1,
		API_GRAPHQL_LIST_FIELD_COST: 1,
		API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
		API_GRAPHQL_MUTATION_BASE_COST: 1,
		API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
	}),
}));

import fs from "node:fs";
import inquirer from "inquirer";
import * as SetupModule from "scripts/setup/setup";
import { administratorEmail, validateEmail } from "scripts/setup/setup";

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
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path === ".backup") return true;
			return false;
		});
		(
			vi.spyOn(fs, "readdirSync") as unknown as MockInstance<
				(path: fs.PathLike) => string[]
			>
		).mockImplementation(() => [".env.1600000000", ".env.1700000000"]);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await administratorEmail({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSyncSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});

	it("should handle inquirer failure gracefully when no backup exists", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(SetupModule.administratorEmail({})).rejects.toThrow(
			"process.exit called",
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(promptError);
		expect(fs.existsSync).toHaveBeenCalledWith(".backup");
		expect(processExitSpy).toHaveBeenCalledWith(1);

		processExitSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});
