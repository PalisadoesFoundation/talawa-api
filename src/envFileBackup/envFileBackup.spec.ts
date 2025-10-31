import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { envFileBackup } from "./envFileBackup";
vi.mock("node:fs/promises", () => ({
	access: vi.fn(),
	copyFile: vi.fn(),
	mkdir: vi.fn(),
}));
vi.mock("inquirer", () => ({
	default: { prompt: vi.fn() },
}));

describe("envFileBackup", () => {
	const mockCwd = "/test/path";
	const originalCwd = process.cwd;

	beforeEach(() => {
		vi.clearAllMocks();
		process.cwd = vi.fn(() => mockCwd);
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		process.cwd = originalCwd;
		vi.restoreAllMocks();
	});

	it("should create backup when user confirms", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(access).mockResolvedValue(undefined);
		vi.mocked(copyFile).mockResolvedValue(undefined);

		const mockEpochMs = 1234567890000;
		const mockEpochSec = 1234567890;
		vi.spyOn(Date, "now").mockReturnValue(mockEpochMs);

		await envFileBackup();

		expect(mkdir).toHaveBeenCalledWith(path.join(mockCwd, ".backup"), {
			recursive: true,
		});
		expect(copyFile).toHaveBeenCalledWith(
			path.join(mockCwd, ".env"),
			path.join(mockCwd, ".backup", `.env.${mockEpochSec}`),
		);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining(`.env.${mockEpochSec}`),
		);
	});

	it("should not create backup when user declines", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: false });

		await envFileBackup();

		expect(mkdir).not.toHaveBeenCalled();
		expect(copyFile).not.toHaveBeenCalled();
	});

	it("should ensure .backup directory exists when backing up", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(access).mockResolvedValue(undefined);
		vi.mocked(copyFile).mockResolvedValue(undefined);

		const mockEpochMs = 1234567890000;
		vi.spyOn(Date, "now").mockReturnValue(mockEpochMs);

		await envFileBackup();

		expect(mkdir).toHaveBeenCalledWith(path.join(mockCwd, ".backup"), {
			recursive: true,
		});
	});

	it("should handle missing .env file gracefully", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockResolvedValue(undefined);
		const enoentError = Object.assign(new Error("File not found"), {
			code: "ENOENT",
		});
		vi.mocked(access).mockRejectedValue(enoentError);

		await envFileBackup();

		expect(copyFile).not.toHaveBeenCalled();
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining("No .env file found"),
		);
	});

	it("should throw error when directory creation fails", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockRejectedValue(new Error("Permission denied"));
		vi.spyOn(Date, "now").mockReturnValue(1234567890000);

		await expect(envFileBackup()).rejects.toThrow(
			"Failed to create .env backup: Permission denied",
		);
	});

	it("should throw error when file copy fails", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(access).mockResolvedValue(undefined);
		vi.mocked(copyFile).mockRejectedValue(new Error("Disk full"));
		vi.spyOn(Date, "now").mockReturnValue(1234567890000);

		await expect(envFileBackup()).rejects.toThrow(
			"Failed to backup .env file: Disk full",
		);
	});

	it("should use correct epoch timestamp format", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(access).mockResolvedValue(undefined);
		vi.mocked(copyFile).mockResolvedValue(undefined);

		const mockEpochMs = 1609459200000;
		const mockEpochSec = 1609459200;
		vi.spyOn(Date, "now").mockReturnValue(mockEpochMs);

		await envFileBackup();

		expect(copyFile).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining(`.env.${mockEpochSec}`),
		);
	});
});
