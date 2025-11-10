import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import { backupOldEnvFile } from "scripts/setup/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("Setup -> backupOldEnvFile", () => {
	const backupDir = ".backup";
	const tempBackupFile = ".env.backup";

	beforeEach(() => {
		vi.resetAllMocks();
		// Clean up any existing test files
		if (fs.existsSync(tempBackupFile)) {
			fs.unlinkSync(tempBackupFile);
		}
		if (fs.existsSync(backupDir)) {
			const files = fs.readdirSync(backupDir);
			for (const file of files) {
				fs.unlinkSync(path.join(backupDir, file));
			}
			fs.rmdirSync(backupDir);
		}
	});

	afterEach(() => {
		vi.resetAllMocks();
		// Clean up test files
		if (fs.existsSync(tempBackupFile)) {
			fs.unlinkSync(tempBackupFile);
		}
		if (fs.existsSync(backupDir)) {
			const files = fs.readdirSync(backupDir);
			for (const file of files) {
				fs.unlinkSync(path.join(backupDir, file));
			}
			fs.rmdirSync(backupDir);
		}
	});

	it("should do nothing if .env.backup does not exist", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");

		await backupOldEnvFile();

		expect(promptMock).not.toHaveBeenCalled();
		expect(fs.existsSync(backupDir)).toBe(false);
	});

	it("should create .backup directory and save backup when user confirms", async () => {
		// Create a temporary backup file
		const testContent = "TEST_VAR=test_value\nANOTHER_VAR=another_value";
		fs.writeFileSync(tempBackupFile, testContent);

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: true });

		// Mock Date.now to ensure consistent timestamp
		const mockTimestamp = 1700000000000; // Nov 14, 2023
		const mockEpochSeconds = Math.floor(mockTimestamp / 1000);
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		await backupOldEnvFile();

		const expectedBackupPath = path.join(backupDir, `.env.${mockEpochSeconds}`);

		// Verify .backup directory was created
		expect(fs.existsSync(backupDir)).toBe(true);

		// Verify backup file was created with correct name
		expect(fs.existsSync(expectedBackupPath)).toBe(true);

		// Verify content was copied correctly
		const backedUpContent = fs.readFileSync(expectedBackupPath, "utf8");
		expect(backedUpContent).toBe(testContent);

		// Verify temporary backup was cleaned up
		expect(fs.existsSync(tempBackupFile)).toBe(false);

		// Verify prompt was called
		expect(promptMock).toHaveBeenCalledWith([
			{
				type: "confirm",
				name: "backupOldEnv",
				message: "Would you like to backup the old .env file? (Y)/N",
				default: true,
			},
		]);
	});

	it("should not create backup when user declines", async () => {
		// Create a temporary backup file
		const testContent = "TEST_VAR=test_value";
		fs.writeFileSync(tempBackupFile, testContent);

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: false });

		await backupOldEnvFile();

		// Verify .backup directory was not created
		expect(fs.existsSync(backupDir)).toBe(false);

		// Verify temporary backup was still cleaned up
		expect(fs.existsSync(tempBackupFile)).toBe(false);

		expect(promptMock).toHaveBeenCalled();
	});

	it("should use correct UTC epoch timestamp in filename", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");

		// Test with different timestamps
		const testTimestamps = [1609459200000, 1640995200000, 1672531200000];

		for (const timestamp of testTimestamps) {
			// Create a temporary backup file for each iteration
			fs.writeFileSync(tempBackupFile, "TEST=value");

			// Mock the prompt response for this iteration
			promptMock.mockResolvedValueOnce({ backupOldEnv: true });

			const mockEpochSeconds = Math.floor(timestamp / 1000);
			vi.spyOn(Date, "now").mockReturnValue(timestamp);

			await backupOldEnvFile();

			const expectedBackupPath = path.join(
				backupDir,
				`.env.${mockEpochSeconds}`,
			);
			expect(fs.existsSync(expectedBackupPath)).toBe(true);
		}
	});

	it("should handle errors gracefully and clean up temporary backup", async () => {
		// Create a temporary backup file
		fs.writeFileSync(tempBackupFile, "TEST=value");

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: true });

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// Mock Date.now for consistent timestamp
		const mockTimestamp = 1700000000000;
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		// Mock fs.mkdirSync to work, but fs.copyFileSync to throw an error
		const originalCopyFileSync = fs.copyFileSync;
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation((src, dest) => {
				// Allow the temporary backup creation in initializeEnvFile to work
				// but fail when trying to create the permanent backup
				if (dest.toString().includes(".backup/")) {
					throw new Error("Disk full");
				}
				return originalCopyFileSync(src, dest);
			});

		const originalUnlinkSync = fs.unlinkSync;
		const unlinkSyncSpy = vi
			.spyOn(fs, "unlinkSync")
			.mockImplementation((path) => {
				// Actually delete the file to verify cleanup
				return originalUnlinkSync(path);
			});

		await expect(backupOldEnvFile()).rejects.toThrow("Disk full");

		// Verify temporary backup was cleaned up even on error
		expect(fs.existsSync(tempBackupFile)).toBe(false);

		copyFileSyncSpy.mockRestore();
		unlinkSyncSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it("should create .backup directory if it doesn't exist", async () => {
		// Create a temporary backup file
		fs.writeFileSync(tempBackupFile, "TEST=value");

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: true });

		// Ensure .backup directory doesn't exist
		expect(fs.existsSync(backupDir)).toBe(false);

		await backupOldEnvFile();

		// Verify .backup directory was created
		expect(fs.existsSync(backupDir)).toBe(true);
		expect(fs.statSync(backupDir).isDirectory()).toBe(true);
	});

	it("should work correctly when .backup directory already exists", async () => {
		// Create .backup directory and an existing backup
		fs.mkdirSync(backupDir);
		fs.writeFileSync(path.join(backupDir, ".env.1600000000"), "OLD=backup");

		// Create a temporary backup file
		fs.writeFileSync(tempBackupFile, "NEW=backup");

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: true });

		const mockTimestamp = 1700000000000;
		const mockEpochSeconds = Math.floor(mockTimestamp / 1000);
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		await backupOldEnvFile();

		// Verify old backup still exists
		expect(fs.existsSync(path.join(backupDir, ".env.1600000000"))).toBe(true);

		// Verify new backup was created
		const newBackupPath = path.join(backupDir, `.env.${mockEpochSeconds}`);
		expect(fs.existsSync(newBackupPath)).toBe(true);
		expect(fs.readFileSync(newBackupPath, "utf8")).toBe("NEW=backup");
	});

	it("should log success message with correct filename", async () => {
		// Create a temporary backup file
		fs.writeFileSync(tempBackupFile, "TEST=value");

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: true });

		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const mockTimestamp = 1700000000000;
		const mockEpochSeconds = Math.floor(mockTimestamp / 1000);
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		await backupOldEnvFile();

		const expectedPath = path.join(backupDir, `.env.${mockEpochSeconds}`);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`Old .env file backed up as: ${expectedPath}`,
		);

		consoleLogSpy.mockRestore();
	});

	it("should log error message when backup fails", async () => {
		// Create a temporary backup file
		fs.writeFileSync(tempBackupFile, "TEST=value");

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ backupOldEnv: true });

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// Mock Date.now for consistent timestamp
		const mockTimestamp = 1700000000000;
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		const testError = new Error("Permission denied");
		const originalCopyFileSync = fs.copyFileSync;
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation((src, dest) => {
				// Allow other copy operations but fail on permanent backup
				if (dest.toString().includes(".backup/")) {
					throw testError;
				}
				return originalCopyFileSync(src, dest);
			});

		await expect(backupOldEnvFile()).rejects.toThrow("Permission denied");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Error during backup process:",
			testError,
		);

		consoleErrorSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
	});
});
