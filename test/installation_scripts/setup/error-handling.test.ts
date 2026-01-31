import fs from "node:fs";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");
vi.mock("scripts/setup/envFileBackup/envFileBackup", () => ({
	envFileBackup: vi.fn().mockResolvedValue(true),
}));
vi.mock("node:fs", () => {
	const promises = {
		readFile: vi.fn(),
		writeFile: vi.fn(),
		access: vi.fn(),
		copyFile: vi.fn(),
		readdir: vi.fn().mockResolvedValue([]),
	};
	return {
		promises: promises,
		default: {
			promises: promises,
			existsSync: vi.fn(),
			writeFileSync: vi.fn(),
			readFileSync: vi.fn(),
		},
	};
});
vi.mock("scripts/setup/updateEnvVariable", () => ({
	updateEnvVariable: vi.fn(),
}));

describe("Setup Error Handling", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		process.env.CI = "true"; // Skip interactive parts
		vi.clearAllMocks();

		// Default mocks
		vi.mocked(fs.existsSync).mockReturnValue(false);
		vi.mocked(fs.writeFileSync).mockImplementation(() => {});
		vi.mocked(fs.readFileSync).mockReturnValue("");

		vi.mocked(fs.promises.access).mockResolvedValue(undefined);
		vi.mocked(fs.promises.readFile).mockResolvedValue("");
		vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined);
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	it("should propagate errors from updateEnvVariable", async () => {
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
			throw new Error("process.exit called");
		}) as never);

		// Mock prompt success with minimal answers
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultPostgres: true,
			useDefaultCloudbeaver: true,
			useDefaultCaddy: true,
			envReconfigure: true,
		});

		// Mock updateEnvVariable failure
		vi.mocked(updateEnvVariable).mockRejectedValue(new Error("Write Failed"));

		await expect(setup()).rejects.toThrow("process.exit called");
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});
