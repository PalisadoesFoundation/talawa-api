import fs from "node:fs";
import inquirer from "inquirer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkEnvFile, initializeEnvFile, setCI } from "~/src/setup/setup";
import * as SetupModule from "~/src/setup/setup";

vi.mock("dotenv", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		default: actual,
		config: vi.fn(),
		parse: vi.fn((content) => {
			if (content.includes("KEY1")) return { KEY1: "VAL1", KEY2: "VAL2" };
			if (content.includes("FOO")) return { FOO: "bar" };
			return {};
		}),
	};
});

const envFileName = ".env";

describe("checkEnvFile", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("should return true if .env file exists", () => {
		vi.spyOn(fs, "existsSync").mockReturnValue(true);

		const result = checkEnvFile();
		expect(fs.existsSync).toHaveBeenCalledWith(envFileName);
		expect(result).toBe(true);
	});

	it("should return false if .env file does not exist", () => {
		vi.spyOn(fs, "existsSync").mockReturnValue(false);

		const result = checkEnvFile();
		expect(fs.existsSync).toHaveBeenCalledWith(envFileName);
		expect(result).toBe(false);
	});
});

describe("initializeEnvFile", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("should read from .env.devcontainer when answers.CI is 'false'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "false" });
		await setCI();
		vi.spyOn(fs, "readFileSync").mockReturnValue("KEY1=VAL1\nKEY2=VAL2");

		initializeEnvFile();

		expect(fs.readFileSync).toHaveBeenCalledWith("envFiles/.env.devcontainer");
	});

	it("should read from .env.ci when answers.CI is 'true'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "true" });
		await setCI();
		vi.spyOn(fs, "readFileSync").mockReturnValue("FOO=bar");

		initializeEnvFile();

		expect(fs.readFileSync).toHaveBeenCalledWith("envFiles/.env.ci");
	});

	it("should log error and exit with code 1 if inquirer fails", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(SetupModule.setCI()).rejects.toThrow("process.exit called");

		expect(consoleErrorSpy).toHaveBeenCalledWith(promptError);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		processExitSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});
