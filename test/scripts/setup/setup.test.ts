import { type MockInstance, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import * as SetupModule from "scripts/setup/setup";
describe("Setup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should set up environment variables with default configuration when CI=false", async () => {
		const mockResponses = [
			{ CI: "false" },
			{ useDefaultMinio: "true" },
			{ useDefaultCloudbeaver: "true" },
			{ useDefaultPostgres: "true" },
			{ useDefaultCaddy: "true" },
			{ useDefaultApi: "true" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		if (fs.existsSync(".env")) {
			fs.unlinkSync(".env");
		}
		Reflect.deleteProperty(process.env, "API_LOG_LEVEL");
		await setup();

		const expectedEnv = {
			API_BASE_URL: "http://127.0.0.1:4000",
			API_HOST: "0.0.0.0",
			API_PORT: "4000",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
			API_JWT_EXPIRES_IN: "2592000000",
			API_LOG_LEVEL: "debug",
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

		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const fsReaddirSyncSpy = vi.spyOn(
			fs,
			"readdirSync",
		) as unknown as MockInstance<(path: fs.PathLike) => string[]>;
		fsReaddirSyncSpy.mockImplementation(() => [
			".env.1600000000",
			".env.1700000000",
		]);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => {});

		await expect(SetupModule.setup()).rejects.toThrow("process.exit called");
		expect(processExitSpy).toHaveBeenCalledWith(0);

		expect(fsCopyFileSyncSpy).not.toHaveBeenCalled();

		processExitSpy.mockRestore();
		fsExistsSyncSpy.mockRestore();
		fsReaddirSyncSpy.mockRestore();
		fsCopyFileSyncSpy.mockRestore();
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
		const readdirSyncSpy = vi.spyOn(
			fs,
			"readdirSync",
		) as unknown as MockInstance<(path: fs.PathLike) => string[]>;
		readdirSyncSpy.mockImplementation(() => [
			".env.1600000000",
			".env.1700000000",
		]);

		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		await expect(async () => process.emit("SIGINT")).rejects.toThrow(
			"process.exit called",
		);

		expect(copyFileSpy).toHaveBeenCalledWith(".backup/.env.1700000000", ".env");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nProcess interrupted! Undoing changes...",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		consoleLogSpy.mockRestore();
		processExitSpy.mockRestore();
		copyFileSpy.mockRestore();
		existsSyncSpy.mockRestore();
		readdirSyncSpy.mockRestore();
	});
});
