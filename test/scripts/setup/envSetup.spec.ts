import inquirer from "inquirer";
import * as EnvFileManager from "scripts/setup/envFileManager";
import * as SetupModule from "scripts/setup/setup";
import { checkEnvFile, initializeEnvFile, setCI } from "scripts/setup/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

	it("should return true if .env file exists", async () => {
		vi.spyOn(EnvFileManager, "checkEnvFile").mockResolvedValue(true);

		const result = await checkEnvFile();
		expect(EnvFileManager.checkEnvFile).toHaveBeenCalledWith(envFileName);
		expect(result).toBe(true);
	});

	it("should return false if .env file does not exist", async () => {
		vi.spyOn(EnvFileManager, "checkEnvFile").mockResolvedValue(false);

		const result = await checkEnvFile();
		expect(EnvFileManager.checkEnvFile).toHaveBeenCalledWith(envFileName);
		expect(result).toBe(false);
	});
});

describe("initializeEnvFile", () => {
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
		const answers = await setCI({});
		vi.spyOn(EnvFileManager, "initializeEnvFile").mockResolvedValue(undefined);

		await initializeEnvFile(answers);

		expect(EnvFileManager.initializeEnvFile).toHaveBeenCalledWith(
			expect.objectContaining({
				ci: false,
				envFile: ".env",
				backupFile: ".env.backup",
				tempFile: ".env.tmp",
				templateCiFile: "envFiles/.env.ci",
				templateDevcontainerFile: "envFiles/.env.devcontainer",
			}),
		);
	});

	it("should throw an error if the environment file is missing", async () => {
		vi.spyOn(EnvFileManager, "initializeEnvFile").mockRejectedValue(
			new Error(
				"Configuration file 'envFiles/.env.devcontainer' is missing. Please create the file or use a different environment configuration.",
			),
		);

		await expect(initializeEnvFile({})).rejects.toThrow(
			"Configuration file 'envFiles/.env.devcontainer' is missing. Please create the file or use a different environment configuration.",
		);
	});

	it("should catch errors if reading the env file fails", async () => {
		vi.spyOn(EnvFileManager, "initializeEnvFile").mockRejectedValue(
			new Error("File read error"),
		);

		await expect(initializeEnvFile({})).rejects.toThrow("File read error");

		expect(console.error).toHaveBeenCalledWith(
			`❌ Error: Failed to load environment file '${devEnvFile}'.`,
		);
		expect(console.error).toHaveBeenCalledWith("File read error");
	});

	it("should read from .env.ci when answers.CI is 'true'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "true" });
		const answers = await setCI({});
		vi.spyOn(EnvFileManager, "initializeEnvFile").mockResolvedValue(undefined);

		await initializeEnvFile(answers);

		expect(EnvFileManager.initializeEnvFile).toHaveBeenCalledWith(
			expect.objectContaining({
				ci: true,
				envFile: ".env",
				backupFile: ".env.backup",
				tempFile: ".env.tmp",
				templateCiFile: "envFiles/.env.ci",
				templateDevcontainerFile: "envFiles/.env.devcontainer",
			}),
		);
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

		await expect(SetupModule.setCI({})).rejects.toThrow("process.exit called");

		expect(consoleErrorSpy).toHaveBeenCalledWith(promptError);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		processExitSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});
