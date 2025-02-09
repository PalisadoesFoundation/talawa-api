import fs from "node:fs";
import inquirer from "inquirer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
	const mockEnvContent = "KEY1=VAL1\nKEY2=VAL2";
	const envFileName = ".env";
	const backupEnvFile = ".env.backup";
	const devEnvFile = "envFiles/.env.devcontainer";

	beforeEach(() => {
		vi.resetAllMocks();

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
	it("should read from .env.devcontainer when answers.CI is 'false'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "false" });
		await setCI();
		vi.spyOn(fs, "readFileSync").mockReturnValue("KEY1=VAL1\nKEY2=VAL2");

		initializeEnvFile();

		expect(fs.readFileSync).toHaveBeenCalledWith("envFiles/.env.devcontainer");
	});

	it("should create a backup of .env if it exists", async () => {
		vi.spyOn(fs, "existsSync").mockImplementation(
			(path) => path === envFileName,
		);
		vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue(mockEnvContent);

		initializeEnvFile();

		expect(fs.copyFileSync).toHaveBeenCalledWith(envFileName, backupEnvFile);
		expect(console.log).toHaveBeenCalledWith(
			`✅ Backup created at ${backupEnvFile}`,
		);
	});

	it("should log a warning and return if the environment file is missing", async () => {
		vi.spyOn(fs, "existsSync").mockImplementation(() => false);

		initializeEnvFile();

		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining("⚠️ Warning: Configuration file"),
		);
		expect(console.log).toHaveBeenCalledWith(
			"Please create the file or use a different environment configuration.",
		);
	});

	it("should catch errors if reading the env file fails", async () => {
		vi.spyOn(fs, "existsSync").mockImplementation(
			(path) => path === devEnvFile,
		);
		vi.spyOn(fs, "readFileSync").mockImplementation(() => {
			throw new Error("File read error");
		});

		initializeEnvFile();

		expect(console.error).toHaveBeenCalledWith(
			`❌ Error: Failed to load environment file '${devEnvFile}'.`,
		);
		expect(console.error).toHaveBeenCalledWith("File read error");
		expect(console.log).toHaveBeenCalledWith(
			"Please check the file permissions and ensure it contains valid environment variables.",
		);
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
