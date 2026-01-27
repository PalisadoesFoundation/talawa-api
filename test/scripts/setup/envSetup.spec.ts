import fs from "node:fs";
import inquirer from "inquirer";
import { setCI } from "scripts/setup/services/ciSetup";
import { checkEnvFile, initializeEnvFile } from "scripts/setup/setup";
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
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);

		const result = await checkEnvFile();
		expect(fs.promises.access).toHaveBeenCalledWith(envFileName);
		expect(result).toBe(true);
	});

	it("should return false if .env file does not exist", async () => {
		vi.spyOn(fs.promises, "access").mockRejectedValue(new Error("ENOENT"));

		const result = await checkEnvFile();
		expect(fs.promises.access).toHaveBeenCalledWith(envFileName);
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
		// Mock writeFile to avoid writing to disk
		vi.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should read from .env.devcontainer when answers.CI is 'false'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "false" });
		const answers = await setCI({});
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "readFile").mockResolvedValue("KEY1=VAL1\nKEY2=VAL2");

		await initializeEnvFile(answers);

		expect(fs.promises.readFile).toHaveBeenCalledWith(
			"envFiles/.env.devcontainer",
			{ encoding: "utf-8" },
		);
	});

	it("should throw an error if the environment file is missing", async () => {
		vi.spyOn(fs.promises, "access").mockRejectedValue(new Error("ENOENT"));

		await expect(initializeEnvFile({})).rejects.toThrow(
			"Configuration file 'envFiles/.env.devcontainer' is missing. Please create the file or use a different environment configuration.",
		);
	});

	it("should catch errors if reading the env file fails", async () => {
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined); // file exists
		vi.spyOn(fs.promises, "readFile").mockRejectedValue(
			new Error("File read error"),
		);
		// Ensure initializeEnvFile does NOT log the file content or secrets
		// initializeEnvFile rethrows the error with a generic message
		await expect(initializeEnvFile({})).rejects.toThrow(
			"Failed to load environment file. Please check file permissions and ensure it contains valid environment variables.",
		);

		expect(console.error).toHaveBeenCalledWith(
			`❌ Error: Failed to load environment file '${devEnvFile}'.`,
		);
	});

	it("should read from .env.ci when answers.CI is 'true'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "true" });
		const answers = await setCI({});
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "readFile").mockResolvedValue("FOO=bar");

		await initializeEnvFile(answers);

		expect(fs.promises.readFile).toHaveBeenCalledWith("envFiles/.env.ci", {
			encoding: "utf-8",
		});
	});

	it("should throw error if inquirer fails", async () => {
		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(setCI({})).rejects.toThrow("inquirer failure");
	});
});
