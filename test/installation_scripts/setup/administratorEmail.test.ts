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

const { accessMock, readdirMock, copyFileMock, renameMock, readFileMock, writeFileMock } = vi.hoisted(() => ({
	accessMock: vi.fn(),
	readdirMock: vi.fn(),
	copyFileMock: vi.fn(),
	renameMock: vi.fn(),
	readFileMock: vi.fn(),
	writeFileMock: vi.fn(),
}));

vi.mock("node:fs", () => {
	const promises = {
		access: accessMock,
		readdir: readdirMock,
		copyFile: copyFileMock,
		rename: renameMock,
		readFile: readFileMock,
		writeFile: writeFileMock,
	};
	return {
		promises,
		default: {
			promises,
		},
	};
});

import { promises as fs } from "node:fs";
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

		accessMock.mockResolvedValue(undefined);
		readdirMock.mockResolvedValue([
			".env.1600000000",
			".env.1700000000",
		] as any);
		copyFileMock.mockResolvedValue(undefined);
		renameMock.mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await administratorEmail({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});

	it("should handle inquirer failure gracefully when no backup exists", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		accessMock.mockRejectedValue({ code: "ENOENT" });
		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(SetupModule.administratorEmail({})).rejects.toThrow(
			"process.exit called",
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(promptError);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		processExitSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		consoleWarnSpy.mockRestore();
	});
});
