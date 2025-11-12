import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import * as SetupModule from "scripts/setup/setup";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");
describe("Setup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should set up environment variables with default configuration when CI=false", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ CI: "false" },
			{ useDefaultMinio: "true" },
			{ useDefaultCloudbeaver: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ backupOldEnv: false },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		await setup();

		const expectedEnv = {
			API_BASE_URL: "http://127.0.0.1:4000",
			API_HOST: "0.0.0.0",
			API_PORT: "4000",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
			API_JWT_EXPIRES_IN: "2592000000",
			API_LOG_LEVEL: "info",
			API_MINIO_ACCESS_KEY: "talawa",
			API_MINIO_END_POINT: "minio",
			API_MINIO_PORT: "9000",
			API_MINIO_TEST_END_POINT: "minio-test",
			API_MINIO_USE_SSL: "false",
			API_POSTGRES_DATABASE: "talawa",
			API_POSTGRES_HOST: "postgres",
			API_POSTGRES_PORT: "5432",
			API_POSTGRES_SSL_MODE: "false",
			API_POSTGRES_TEST_HOST: "postgres-test",
			API_POSTGRES_USER: "talawa",
			CI: "false",
			MINIO_ROOT_USER: "talawa",
			CLOUDBEAVER_ADMIN_NAME: "talawa",
			CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1",
			CLOUDBEAVER_MAPPED_PORT: "8978",
			CLOUDBEAVER_SERVER_NAME: "Talawa CloudBeaver Server",
			CLOUDBEAVER_SERVER_URL: "http://127.0.0.1:8978",
			CADDY_HTTP_MAPPED_PORT: "80",
			CADDY_HTTPS_MAPPED_PORT: "443",
			CADDY_HTTP3_MAPPED_PORT: "443",
			CADDY_TALAWA_API_DOMAIN_NAME: "localhost",
			CADDY_TALAWA_API_EMAIL: "talawa@email.com",
			CADDY_TALAWA_API_HOST: "api",
			CADDY_TALAWA_API_PORT: "4000",
		};

		dotenv.config({ path: ".env" });

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(process.env[key]).toBe(value);
		}
	});

	it("should correctly set up environment variables when CI=true (skips CloudBeaver)", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ CI: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ backupOldEnv: false }, // Response for backupOldEnvFile
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		await setup();

		const expectedEnv = {
			API_BASE_URL: "http://127.0.0.1:4000",
			API_HOST: "0.0.0.0",
			API_PORT: "4000",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
			API_IS_GRAPHIQL: "false",
			API_IS_PINO_PRETTY: "false",
			API_JWT_EXPIRES_IN: "2592000000",
			API_LOG_LEVEL: "info",
			API_MINIO_ACCESS_KEY: "talawa",
			API_MINIO_END_POINT: "minio",
			API_MINIO_PORT: "9000",
			API_MINIO_SECRET_KEY: "password",
			API_MINIO_TEST_END_POINT: "minio-test",
			API_MINIO_USE_SSL: "false",
			API_POSTGRES_DATABASE: "talawa",
			API_POSTGRES_HOST: "postgres",
			API_POSTGRES_PASSWORD: "password",
			API_POSTGRES_PORT: "5432",
			API_POSTGRES_SSL_MODE: "false",
			API_POSTGRES_TEST_HOST: "postgres-test",
			API_POSTGRES_USER: "talawa",
			CI: "true",
			MINIO_ROOT_PASSWORD: "password",
			MINIO_ROOT_USER: "talawa",
			CADDY_HTTP_MAPPED_PORT: "80",
			CADDY_HTTPS_MAPPED_PORT: "443",
			CADDY_HTTP3_MAPPED_PORT: "443",
			CADDY_TALAWA_API_DOMAIN_NAME: "localhost",
			CADDY_TALAWA_API_EMAIL: "talawa@email.com",
			CADDY_TALAWA_API_HOST: "api",
			CADDY_TALAWA_API_PORT: "4000",
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(process.env[key]).toBe(value);
		}
	});
	it("should restore .env from backup and exit when envReconfigure is false", async () => {
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			envReconfigure: false,
		});

		await expect(SetupModule.setup()).rejects.toThrow("process.exit called");
		expect(processExitSpy).toHaveBeenCalledWith(0);

		processExitSpy.mockRestore();
	});

	it("should restore .env on SIGINT (Ctrl+C) and exit with code 1", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const copyFileSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);

		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		await expect(async () => process.emit("SIGINT")).rejects.toThrow(
			"process.exit called",
		);
		expect(copyFileSpy).toHaveBeenCalledWith(".env.backup", ".env");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nProcess interrupted! Undoing changes...",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		consoleLogSpy.mockRestore();
		processExitSpy.mockRestore();
		copyFileSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("should call backupOldEnvFile at the end of setup", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ CI: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ backupOldEnv: false }, // Mock response for backupOldEnvFile prompt
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		// Mock fs.existsSync to simulate .env.backup exists
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const unlinkSyncSpy = vi
			.spyOn(fs, "unlinkSync")
			.mockImplementation(() => {});

		await setup();

		// Verify that the backup prompt was called (8th prompt call)
		expect(promptMock).toHaveBeenCalledTimes(8);
		expect(promptMock).toHaveBeenNthCalledWith(8, [
			{
				type: "confirm",
				name: "backupOldEnv",
				message: "Would you like to backup the old .env file? (Y)/N",
				default: true,
			},
		]);

		existsSyncSpy.mockRestore();
		unlinkSyncSpy.mockRestore();
	});

	it("should create .env.backup before overwriting .env file", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ CI: "false" },
			{ useDefaultMinio: "true" },
			{ useDefaultCloudbeaver: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ backupOldEnv: false },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		// Track the order of operations
		const operationOrder: string[] = [];

		// Mock fs operations to track order
		const copyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation((src, dest) => {
				if (dest === ".env.backup") {
					operationOrder.push("backup_created");
				}
			});

		const writeFileSyncSpy = vi
			.spyOn(fs, "writeFileSync")
			.mockImplementation((file) => {
				if (file === ".env") {
					operationOrder.push("env_overwritten");
				}
			});

		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const readFileSyncSpy = vi
			.spyOn(fs, "readFileSync")
			.mockReturnValue("KEY1=VAL1");
		const unlinkSyncSpy = vi
			.spyOn(fs, "unlinkSync")
			.mockImplementation(() => {});

		await setup();

		// Verify backup was created BEFORE .env was overwritten
		expect(operationOrder.indexOf("backup_created")).toBeLessThan(
			operationOrder.indexOf("env_overwritten"),
		);
		expect(operationOrder[0]).toBe("backup_created");

		copyFileSyncSpy.mockRestore();
		writeFileSyncSpy.mockRestore();
		existsSyncSpy.mockRestore();
		readFileSyncSpy.mockRestore();
		unlinkSyncSpy.mockRestore();
	});
});
