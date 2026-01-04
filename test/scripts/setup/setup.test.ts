import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

vi.mock("scripts/setup/envFileBackup/envFileBackup", () => ({
	envFileBackup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("env-schema", () => ({
	envSchema: () => ({
		API_GRAPHQL_SCALAR_FIELD_COST: 1,
		API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
		API_GRAPHQL_OBJECT_FIELD_COST: 1,
		API_GRAPHQL_LIST_FIELD_COST: 1,
		API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
		API_GRAPHQL_MUTATION_BASE_COST: 1,
		API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
	}),
}));

vi.mock("inquirer");

import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { envFileBackup } from "scripts/setup/envFileBackup/envFileBackup";

describe("Setup", () => {
	let setup: () => Promise<Record<string, string>>;
	let SetupModule: typeof import("scripts/setup/setup");

	beforeAll(async () => {
		process.env.API_GRAPHQL_SCALAR_FIELD_COST = "1";
		process.env.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST = "1";
		process.env.API_GRAPHQL_OBJECT_FIELD_COST = "1";
		process.env.API_GRAPHQL_LIST_FIELD_COST = "1";
		process.env.API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST = "1";
		process.env.API_GRAPHQL_MUTATION_BASE_COST = "1";
		process.env.API_GRAPHQL_SUBSCRIPTION_BASE_COST = "1";

		vi.doMock("env-schema", () => ({
			envSchema: () => ({
				API_GRAPHQL_SCALAR_FIELD_COST: 1,
				API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
				API_GRAPHQL_OBJECT_FIELD_COST: 1,
				API_GRAPHQL_LIST_FIELD_COST: 1,
				API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
				API_GRAPHQL_MUTATION_BASE_COST: 1,
				API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
			}),
		}));

		const module = await import("scripts/setup/setup");
		setup = module.setup;
		SetupModule = module;
	});

	const originalIsTTY = process.stdin.isTTY;
	const originalExistsSync = fs.existsSync;
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();

		Object.defineProperty(process.stdin, "isTTY", {
			value: originalIsTTY,
			configurable: true,
		});

		try {
			if (originalExistsSync(".env")) {
				fs.unlinkSync(".env");
			}
		} catch {}
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
		process.env.CI = "true";
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

		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const fsReadFileSyncSpy = vi
			.spyOn(fs, "readFileSync")
			.mockReturnValue(
				[
					"API_BASE_URL=http://127.0.0.1:4000",
					"API_HOST=0.0.0.0",
					"API_PORT=4000",
					"API_IS_APPLY_DRIZZLE_MIGRATIONS=true",
					"API_IS_GRAPHIQL=false",
					"API_IS_PINO_PRETTY=false",
					"API_JWT_EXPIRES_IN=2592000000",
					"API_LOG_LEVEL=info",
					"API_MINIO_ACCESS_KEY=talawa",
					"API_MINIO_END_POINT=minio",
					"API_MINIO_PORT=9000",
					"API_MINIO_SECRET_KEY=password",
					"API_MINIO_TEST_END_POINT=minio-test",
					"API_MINIO_USE_SSL=false",
					"API_POSTGRES_DATABASE=talawa",
					"API_POSTGRES_HOST=postgres",
					"API_POSTGRES_PASSWORD=password",
					"API_POSTGRES_PORT=5432",
					"API_POSTGRES_SSL_MODE=false",
					"API_POSTGRES_TEST_HOST=postgres-test",
					"API_POSTGRES_USER=talawa",
					"CI=true",
					"MINIO_ROOT_PASSWORD=password",
					"MINIO_ROOT_USER=talawa",
					"CADDY_HTTP_MAPPED_PORT=80",
					"CADDY_HTTPS_MAPPED_PORT=443",
					"CADDY_HTTP3_MAPPED_PORT=443",
					"CADDY_TALAWA_API_DOMAIN_NAME=localhost",
					"CADDY_TALAWA_API_EMAIL=talawa@email.com",
					"CADDY_TALAWA_API_HOST=api",
					"CADDY_TALAWA_API_PORT=4000",
					"API_ADMINISTRATOR_USER_EMAIL_ADDRESS=test@email.com",
				].join("\n"),
			);

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

		fsExistsSyncSpy.mockRestore();
		fsReadFileSyncSpy.mockRestore();
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

	it("should skip backup when CI=true and TALAWA_SKIP_ENV_BACKUP=true", async () => {
		process.env.CI = "true";
		process.env.TALAWA_SKIP_ENV_BACKUP = "true";

		if (fs.existsSync(".env")) {
			fs.unlinkSync(".env");
		}
		fs.writeFileSync(".env", "DUMMY=content");

		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			envReconfigure: true,
			CI: "true",
			useDefaultMinio: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			useDefaultApi: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});

		await setup();

		expect(envFileBackup).toHaveBeenCalledWith(false);
	});

	it("should backup by default when CI=true and TALAWA_SKIP_ENV_BACKUP is not set", async () => {
		process.env.CI = "true";
		process.env.TALAWA_SKIP_ENV_BACKUP = undefined;

		if (fs.existsSync(".env")) {
			fs.unlinkSync(".env");
		}

		fs.writeFileSync(".env", "DUMMY=content");

		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			envReconfigure: true,
			CI: "true",
			useDefaultMinio: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			useDefaultApi: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});

		await setup();

		expect(envFileBackup).toHaveBeenCalledWith(true);
	});

	it("should not call envFileBackup when .env file does not exist", async () => {
		process.env.CI = "false";

		if (originalExistsSync(".env")) {
			fs.unlinkSync(".env");
		}

		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (String(path) === ".env") return false;
			if (
				String(path) === "envFiles/.env.devcontainer" ||
				String(path) === "envFiles/.env.ci"
			)
				return true;
			return originalExistsSync(path as fs.PathLike);
		});

		const originalReadFileSync = fs.readFileSync;
		const fsReadFileSyncSpy = vi
			.spyOn(fs, "readFileSync")
			.mockImplementation((path, options) => {
				if (
					String(path) === "envFiles/.env.devcontainer" ||
					String(path) === "envFiles/.env.ci"
				) {
					return "API_PORT=4000\nAPI_HOST=0.0.0.0";
				}
				return originalReadFileSync(path, options);
			});

		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			CI: "false",
			useDefaultMinio: true,
			useDefaultCloudbeaver: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			useDefaultApi: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});

		await setup();

		expect(envFileBackup).not.toHaveBeenCalled();
		fsReadFileSyncSpy.mockRestore();
	});

	it("should call envFileBackup with true when user confirms backup in interactive mode", async () => {
		process.env.CI = "false";
		Object.defineProperty(process.stdin, "isTTY", {
			value: true,
			configurable: true,
		});

		Reflect.deleteProperty(process.env, "TALAWA_SKIP_ENV_BACKUP");

		fs.writeFileSync(".env", "EXISTING=content");

		vi.spyOn(fs, "existsSync").mockReturnValue(true);

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ envReconfigure: true });
		promptMock.mockResolvedValueOnce({ shouldBackup: true });
		promptMock.mockResolvedValueOnce({ CI: "false" });
		promptMock.mockResolvedValueOnce({ useDefaultMinio: true });
		promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: true });
		promptMock.mockResolvedValueOnce({ useDefaultPostgres: true });
		promptMock.mockResolvedValueOnce({ useDefaultCaddy: true });
		promptMock.mockResolvedValueOnce({ useDefaultApi: true });
		promptMock.mockResolvedValueOnce({
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});

		await setup();

		expect(envFileBackup).toHaveBeenCalledWith(true);

		if (fs.existsSync(".env")) {
			fs.unlinkSync(".env");
		}
		Object.defineProperty(process.stdin, "isTTY", {
			value: originalIsTTY,
			configurable: true,
		});
	});

	it("should call envFileBackup with false when user denies backup in interactive mode", async () => {
		process.env.CI = "false";
		const originalIsTTY = process.stdin.isTTY;
		Object.defineProperty(process.stdin, "isTTY", {
			value: true,
			configurable: true,
		});

		Reflect.deleteProperty(process.env, "TALAWA_SKIP_ENV_BACKUP");

		fs.writeFileSync(".env", "EXISTING=content");

		vi.spyOn(fs, "existsSync").mockReturnValue(true);

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockResolvedValueOnce({ envReconfigure: true });
		promptMock.mockResolvedValueOnce({ shouldBackup: false });
		promptMock.mockResolvedValueOnce({ CI: "false" });
		promptMock.mockResolvedValueOnce({ useDefaultMinio: true });
		promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: true });
		promptMock.mockResolvedValueOnce({ useDefaultPostgres: true });
		promptMock.mockResolvedValueOnce({ useDefaultCaddy: true });
		promptMock.mockResolvedValueOnce({ useDefaultApi: true });
		promptMock.mockResolvedValueOnce({
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});

		await setup();

		expect(envFileBackup).toHaveBeenCalledWith(false);

		if (fs.existsSync(".env")) {
			fs.unlinkSync(".env");
		}
		Object.defineProperty(process.stdin, "isTTY", {
			value: originalIsTTY,
			configurable: true,
		});
	});
});
