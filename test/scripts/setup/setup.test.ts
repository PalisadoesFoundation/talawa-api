import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { envFileBackup } from "scripts/setup/envFileBackup/envFileBackup";
import { setup } from "scripts/setup/setup";
import * as SetupModule from "scripts/setup/setup";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");
vi.mock("scripts/setup/envFileBackup/envFileBackup");
describe("Setup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should set up environment variables with default configuration when CI=false", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ shouldBackup: true },
			{ CI: "false" },
			{ useDefaultMinio: true },
			{ useDefaultCloudbeaver: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ useDefaultApi: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
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
			if (process.env[key] !== value) {
				console.log(
					`Mismatch for ${key}: expected ${value}, got ${process.env[key]}`,
				);
			}
			expect(process.env[key]).toBe(value);
		}
	});

	it("should correctly set up environment variables when CI=true (skips CloudBeaver)", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ shouldBackup: true },
			{ CI: "true" },
			{ useDefaultMinio: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ useDefaultApi: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
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
		const existsSyncSpy = vi
			.spyOn(fs, "existsSync")
			.mockImplementation((path) => {
				if (path === ".backup") return true;
				return false;
			});
		const readdirSyncSpy = vi
			.spyOn(fs, "readdirSync")
			.mockImplementation((() => [
				".env.1000",
				".env.2000",
				"other.file",
			]) as unknown as typeof fs.readdirSync);

		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		await expect(async () => process.emit("SIGINT")).rejects.toThrow(
			"process.exit called",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nProcess interrupted! Undoing changes...",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Restoring from latest backup"),
		);
		expect(copyFileSpy).toHaveBeenCalledWith(
			expect.stringContaining(".env.2000"),
			".env",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		consoleLogSpy.mockRestore();
		processExitSpy.mockRestore();
		copyFileSpy.mockRestore();
		existsSyncSpy.mockRestore();
		readdirSyncSpy.mockRestore();
	});

	describe("backup functionality", () => {
		it("should not prompt for backup if .env file does not exist", async () => {
			const existsSyncSpy = vi
				.spyOn(fs, "existsSync")
				.mockImplementation((path) => {
					if (path === ".env" || path === ".env.backup") return false;
					return true;
				});
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({ CI: "false" });
			promptMock.mockResolvedValueOnce({ useDefaultMinio: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultPostgres: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultCaddy: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultApi: "true" });
			promptMock.mockResolvedValueOnce({
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			});

			await setup();

			expect(existsSyncSpy).toHaveBeenCalled();
			expect(promptMock).not.toHaveBeenCalledWith([
				expect.objectContaining({ name: "shouldBackup" }),
			]);
			expect(envFileBackup).not.toHaveBeenCalled();
			existsSyncSpy.mockRestore();
		});

		it("should call envFileBackup with true when user confirms backup", async () => {
			const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
			const unlinkSyncSpy = vi
				.spyOn(fs, "unlinkSync")
				.mockImplementation(() => {});
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({ envReconfigure: true });
			promptMock.mockResolvedValueOnce({ shouldBackup: true });
			promptMock.mockResolvedValueOnce({ CI: "false" });
			promptMock.mockResolvedValueOnce({ useDefaultMinio: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultPostgres: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultCaddy: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultApi: "true" });
			promptMock.mockResolvedValueOnce({
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			});

			await setup();

			expect(existsSyncSpy).toHaveBeenCalled();
			expect(promptMock).toHaveBeenCalledWith([
				expect.objectContaining({ name: "shouldBackup" }),
			]);
			expect(envFileBackup).toHaveBeenCalledWith(true);
			existsSyncSpy.mockRestore();
			unlinkSyncSpy.mockRestore();
		});

		it("should call envFileBackup with false when user denies backup", async () => {
			const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
			const unlinkSyncSpy = vi
				.spyOn(fs, "unlinkSync")
				.mockImplementation(() => {});
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({ envReconfigure: true });
			promptMock.mockResolvedValueOnce({ shouldBackup: false });
			promptMock.mockResolvedValueOnce({ CI: "false" });
			promptMock.mockResolvedValueOnce({ useDefaultMinio: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultPostgres: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultCaddy: "true" });
			promptMock.mockResolvedValueOnce({ useDefaultApi: "true" });
			promptMock.mockResolvedValueOnce({
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			});

			await setup();

			expect(existsSyncSpy).toHaveBeenCalled();
			expect(promptMock).toHaveBeenCalledWith([
				expect.objectContaining({ name: "shouldBackup" }),
			]);
			expect(envFileBackup).toHaveBeenCalledWith(false);
			existsSyncSpy.mockRestore();
			unlinkSyncSpy.mockRestore();
		});
	});
});
