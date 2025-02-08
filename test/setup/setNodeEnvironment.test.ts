import fs from "node:fs";
import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setNodeEnvironment } from "~/src/setup/setup";
import * as SetupModule from "~/src/setup/setup";

vi.mock("inquirer");

describe("Setup -> setNodeEnvironment", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});
	it("should update NODE_ENV when selection is made", async () => {
		const mockedNodeEnv = "development";
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			NODE_ENV: mockedNodeEnv,
		});
		const answers = await setNodeEnvironment();

		expect(answers.NODE_ENV).toBe(mockedNodeEnv);
	});
	it("should log error, create a backup, and exit with code 1 if inquirer fails", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});

		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(SetupModule.setNodeEnvironment()).rejects.toThrow(
			"process.exit called",
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(promptError);
		expect(fs.existsSync).toHaveBeenCalledWith(".env.backup");
		expect(fs.copyFileSync).toHaveBeenCalledWith(".env.backup", ".env");
		expect(processExitSpy).toHaveBeenCalledWith(1);

		processExitSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it("should log error but not create a backup if .env.backup is missing", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const copyFileSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(SetupModule.setNodeEnvironment()).rejects.toThrow(
			"process.exit called",
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(promptError);
		expect(fs.existsSync).toHaveBeenCalledWith(".env.backup");
		expect(copyFileSpy).not.toHaveBeenCalled();
		expect(processExitSpy).toHaveBeenCalledWith(1);

		processExitSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});
