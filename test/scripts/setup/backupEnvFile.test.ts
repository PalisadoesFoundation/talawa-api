import fs from "node:fs";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import * as SetupModule from "scripts/setup/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("Backup functionality", () => {
	const originalEnv = { ...process.env };
	const backupDir = ".backup";
	const envFileName = ".env";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should create backup at the end when user confirms backup and .env exists", async () => {
		// Set required environment variables that are validated during setup
		process.env.POSTGRES_PASSWORD = "password";
		process.env.MINIO_ROOT_PASSWORD = "password";

		const mockResponses = [
			{ envReconfigure: true },
			{ backupEnv: true },
			{ CI: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const existsSyncSpy = vi.spyOn(fs, "existsSync");
		existsSyncSpy.mockImplementation((path) => {
			if (path === envFileName) return true;
			if (path === backupDir) return false;
			if (path === ".env.backup") return false;
			return false;
		});

		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Mock Date.now to return a fixed timestamp
		const mockTimestamp = 1700000000000; // 2023-11-14T22:13:20.000Z
		const mockEpochSeconds = Math.floor(mockTimestamp / 1000);
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		await setup();

		// Verify backup directory was created
		expect(mkdirSyncSpy).toHaveBeenCalledWith(backupDir, { recursive: true });

		// Verify .env file was copied to backup location
		const expectedBackupPath = `${backupDir}/.env.${mockEpochSeconds}`;
		expect(copyFileSyncSpy).toHaveBeenCalledWith(
			envFileName,
			expectedBackupPath,
		);

		// Verify user was informed about backup location
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`✅ Backup saved as: ${expectedBackupPath}`,
		);

		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		consoleLogSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should not prompt for backup when .env file does not exist initially", async () => {
		// Set required environment variables that are validated during setup
		process.env.POSTGRES_PASSWORD = "password";
		process.env.MINIO_ROOT_PASSWORD = "password";

		const mockResponses = [
			{ CI: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const existsSyncSpy = vi.spyOn(fs, "existsSync");
		existsSyncSpy.mockImplementation((path) => {
			// Mock the env template file to exist
			if (path === "envFiles/.env.ci") return true;
			if (path === ".env.backup") return false;
			// .env file does not exist initially
			return false;
		});

		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});
		const writeFileSyncSpy = vi
			.spyOn(fs, "writeFileSync")
			.mockImplementation(() => {});
		const readFileSyncSpy = vi
			.spyOn(fs, "readFileSync")
			.mockReturnValue("CI=true\nAPI_BASE_URL=http://127.0.0.1:4000");
		const unlinkSyncSpy = vi
			.spyOn(fs, "unlinkSync")
			.mockImplementation(() => {});

		await setup();

		// Verify that backup prompt was never shown
		const promptCalls = promptMock.mock.calls;
		const backupPromptCall = promptCalls.find((call) =>
			JSON.stringify(call).includes("backupEnv"),
		);
		expect(backupPromptCall).toBeUndefined();

		// Verify no backup was created
		expect(copyFileSyncSpy).not.toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining(backupDir),
		);

		unlinkSyncSpy.mockRestore();
		readFileSyncSpy.mockRestore();
		writeFileSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should not create backup when user declines backup prompt", async () => {
		// Set required environment variables that are validated during setup
		process.env.POSTGRES_PASSWORD = "password";
		process.env.MINIO_ROOT_PASSWORD = "password";

		const mockResponses = [
			{ envReconfigure: true },
			{ backupEnv: false },
			{ CI: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});
		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const unlinkSyncSpy = vi
			.spyOn(fs, "unlinkSync")
			.mockImplementation(() => {});

		await setup();

		// Verify backup was not created
		expect(mkdirSyncSpy).not.toHaveBeenCalledWith(backupDir, {
			recursive: true,
		});
		expect(copyFileSyncSpy).not.toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining(backupDir),
		);

		unlinkSyncSpy.mockRestore();
		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should handle errors gracefully when backup fails", async () => {
		// Set required environment variables that are validated during setup
		process.env.POSTGRES_PASSWORD = "password";
		process.env.MINIO_ROOT_PASSWORD = "password";

		const mockResponses = [
			{ envReconfigure: true },
			{ backupEnv: true },
			{ CI: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const existsSyncSpy = vi.spyOn(fs, "existsSync");
		existsSyncSpy.mockImplementation((path) => {
			if (path === envFileName) return true;
			return false;
		});

		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {
				throw new Error("Permission denied");
			});
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await setup();

		// Verify error was logged
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("❌ Error creating backup:"),
		);

		consoleErrorSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});
});

describe("backupEnvFile function", () => {
	const backupDir = ".backup";
	const envFileName = ".env";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("should create backup directory if it does not exist", () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync");
		existsSyncSpy.mockImplementation((path) => {
			if (path === envFileName) return true;
			if (path === backupDir) return false;
			return false;
		});

		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		const mockTimestamp = 1700000000000;
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		SetupModule.backupEnvFile();

		expect(mkdirSyncSpy).toHaveBeenCalledWith(backupDir, { recursive: true });

		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should not create backup directory if it already exists", () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync");
		existsSyncSpy.mockImplementation((path) => {
			if (path === envFileName) return true;
			if (path === backupDir) return true;
			return false;
		});

		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		const mockTimestamp = 1700000000000;
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		SetupModule.backupEnvFile();

		// mkdirSync should NOT be called since the directory already exists
		expect(mkdirSyncSpy).not.toHaveBeenCalled();

		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should copy .env file to backup directory with correct naming format", () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		const mockTimestamp = 1700000000000;
		const mockEpochSeconds = Math.floor(mockTimestamp / 1000);
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		const result = SetupModule.backupEnvFile();

		const expectedBackupPath = `${backupDir}/.env.${mockEpochSeconds}`;
		expect(copyFileSyncSpy).toHaveBeenCalledWith(
			envFileName,
			expectedBackupPath,
		);
		expect(result).toBe(expectedBackupPath);

		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should throw error when .env file does not exist", () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);

		expect(() => SetupModule.backupEnvFile()).toThrow(
			".env file does not exist, cannot create backup",
		);

		existsSyncSpy.mockRestore();
	});

	it("should return the correct backup file path", () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		const mockTimestamp = 1234567890000;
		const mockEpochSeconds = Math.floor(mockTimestamp / 1000);
		vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

		const result = SetupModule.backupEnvFile();

		const expectedBackupPath = `${backupDir}/.env.${mockEpochSeconds}`;
		expect(result).toBe(expectedBackupPath);

		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should use current UTC epoch timestamp in seconds", () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const mkdirSyncSpy = vi
			.spyOn(fs, "mkdirSync")
			.mockImplementation(() => undefined);
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		// Test with different timestamps
		const timestamps = [
			1700000000000, // 2023-11-14T22:13:20.000Z
			1600000000000, // 2020-09-13T12:26:40.000Z
			1500000000000, // 2017-07-14T02:40:00.000Z
		];

		for (const timestamp of timestamps) {
			vi.spyOn(Date, "now").mockReturnValue(timestamp);
			const epochSeconds = Math.floor(timestamp / 1000);

			const result = SetupModule.backupEnvFile();

			expect(result).toBe(`${backupDir}/.env.${epochSeconds}`);
		}

		mkdirSyncSpy.mockRestore();
		copyFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});
});
