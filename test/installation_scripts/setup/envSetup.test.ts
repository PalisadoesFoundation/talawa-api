import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
	accessMock,
	readFileMock,
	writeFileMock,
	readdirMock,
	configMock,
	parseMock,
} = vi.hoisted(() => ({
	accessMock: vi.fn(),
	readFileMock: vi.fn(),
	writeFileMock: vi.fn(),
	readdirMock: vi.fn().mockResolvedValue([]),
	configMock: vi.fn(),
	parseMock: vi.fn((content: string) => {
		if (content.includes("KEY1")) return { KEY1: "VAL1", KEY2: "VAL2" };
		if (content.includes("FOO")) return { FOO: "bar" };
		return {};
	}),
}));

// env-schema mock is handled by setup-env.ts

vi.mock("dotenv", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		default: actual,
		config: configMock,
		parse: parseMock,
	};
});

vi.mock("node:fs", () => {
	const promises = {
		access: accessMock,
		readFile: readFileMock,
		writeFile: writeFileMock,
		readdir: readdirMock,
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
import { checkEnvFile, initializeEnvFile, setCI } from "scripts/setup/setup";

const envFileName = ".env";

describe("checkEnvFile", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("should return true if .env file exists", async () => {
		accessMock.mockResolvedValue(undefined);

		const result = await checkEnvFile();
		expect(fs.access).toHaveBeenCalledWith(envFileName);
		expect(result).toBe(true);
	});

	it("should return false if .env file does not exist", async () => {
		accessMock.mockRejectedValue(new Error("ENOENT"));

		const result = await checkEnvFile();
		expect(fs.access).toHaveBeenCalledWith(envFileName);
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

		readdirMock.mockResolvedValue([]);
		accessMock.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
	it("should read from .env.devcontainer when answers.CI is 'false'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "false" });
		const answers = await setCI({});

		accessMock.mockResolvedValue(undefined);
		readFileMock.mockResolvedValue("KEY1=VAL1\nKEY2=VAL2");
		writeFileMock.mockResolvedValue(undefined);

		await initializeEnvFile(answers);

		expect(readFileMock).toHaveBeenCalledWith("envFiles/.env.devcontainer", {
			encoding: "utf-8",
		});
	});

	it("should throw an error if the environment file is missing", async () => {
		accessMock.mockRejectedValue(new Error("ENOENT"));

		await expect(initializeEnvFile({})).rejects.toThrow(
			"Configuration file 'envFiles/.env.devcontainer' is missing. Please create the file or use a different environment configuration.",
		);
	});

	it("should catch errors if reading the env file fails", async () => {
		accessMock.mockResolvedValue(undefined);
		vi.mocked(fs.readFile).mockRejectedValue(new Error("File read error"));

		await expect(initializeEnvFile({})).rejects.toThrow(
			"Failed to load environment file. Please check file permissions and ensure it contains valid environment variables.",
		);

		expect(console.error).toHaveBeenCalledWith(
			`❌ Error: Failed to load environment file '${devEnvFile}'.`,
		);
		expect(console.error).toHaveBeenCalledWith("File read error");
	});

	it("should read from .env.ci when answers.CI is 'true'", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValue({ CI: "true" });
		const answers = await setCI({});

		accessMock.mockResolvedValue(undefined);
		readFileMock.mockResolvedValue("FOO=bar");
		writeFileMock.mockResolvedValue(undefined);

		await initializeEnvFile(answers);

		expect(readFileMock).toHaveBeenCalledWith("envFiles/.env.ci", {
			encoding: "utf-8",
		});
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
