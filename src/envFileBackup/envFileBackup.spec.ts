import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { envFileBackup } from "./envFileBackup";

vi.mock("fs/promises");
vi.mock("inquirer");

describe("envFileBackup utility", () => {
	const mockCwd = "/test/path";
	const originalCwd = process.cwd;

	beforeEach(() => {
		vi.clearAllMocks();
		process.cwd = vi.fn(() => mockCwd);
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		process.cwd = originalCwd;
		vi.restoreAllMocks();
	});

	it("creates a timestamped backup when user agrees", async () => {
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
		expect(console.info).toHaveBeenCalledWith(
			expect.stringContaining(`.env.${mockEpochSec}`),
		);
	});

	it("does not create a backup when user declines", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: false });

		await envFileBackup();

		expect(mkdir).not.toHaveBeenCalled();
		expect(copyFile).not.toHaveBeenCalled();
	});

	it("ensures .backup directory is created before backing up", async () => {
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

	it("handles missing .env file without throwing", async () => {
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

	it("throws descriptive error if creating .backup directory fails", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockRejectedValue(new Error("Permission denied"));
		vi.spyOn(Date, "now").mockReturnValue(1234567890000);

		await expect(envFileBackup()).rejects.toThrow(
			"Failed to create .env backup: Disk full",
		);
	});

	it("throws descriptive error if copying .env into backup fails", async () => {
		vi.mocked(inquirer.prompt).mockResolvedValueOnce({ shouldBackup: true });
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(access).mockResolvedValue(undefined);
		vi.mocked(copyFile).mockRejectedValue(new Error("Disk full"));
		vi.spyOn(Date, "now").mockReturnValue(1234567890000);

		await expect(envFileBackup()).rejects.toThrow(
			"Failed to backup .env file: Disk full",
		);
	});

	it("uses seconds-since-epoch timestamp in the backup filename", async () => {
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
