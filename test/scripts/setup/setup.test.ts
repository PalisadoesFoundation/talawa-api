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
	envFileBackup: vi.fn().mockResolvedValue(false),
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

vi.mock("scripts/setup/emailSetup", () => ({
	emailSetup: vi.fn().mockImplementation((answers) => Promise.resolve(answers)),
}));

vi.mock("inquirer");

import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { envFileBackup } from "scripts/setup/envFileBackup/envFileBackup";
import type { SetupAnswers } from "scripts/setup/types";

describe("Setup", () => {
	let setup: () => Promise<SetupAnswers>;
	let SetupModule: typeof import("scripts/setup/setup");
	let envExistedBefore: boolean;

	beforeAll(async () => {
		envExistedBefore = fs.existsSync(".env");

		process.env.API_GRAPHQL_SCALAR_FIELD_COST = "1";
		process.env.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST = "1";
		process.env.API_GRAPHQL_OBJECT_FIELD_COST = "1";
		process.env.API_GRAPHQL_LIST_FIELD_COST = "1";
		process.env.API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST = "1";
		process.env.API_GRAPHQL_MUTATION_BASE_COST = "1";
		process.env.API_GRAPHQL_SUBSCRIPTION_BASE_COST = "1";

		// Mock fs to prevent deleting real .env
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

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
			// Only delete .env if it didn't exist before and currently exists
			if (!envExistedBefore && originalExistsSync(".env")) {
				fs.unlinkSync(".env");
			}
		} catch {}
	});

	it("should set up environment variables with default configuration when CI=false", async () => {
		const mockResponses = [
			{ CI: "false" },
			{ useDefaultApi: true },
			{ useDefaultMinio: true },
			{ useDefaultCloudbeaver: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ setupReCaptcha: false },
			{ setupOAuth: false },
			{ setupMetrics: false },
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
			API_JWT_EXPIRES_IN: "900000",
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
			{ useDefaultApi: true },
			{ useDefaultMinio: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ setupReCaptcha: false },
			{ setupOAuth: false },
			{ setupMetrics: false },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const fsAccessSpy = vi
			.spyOn(fs.promises, "access")
			.mockResolvedValue(undefined);
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
		fsAccessSpy.mockRestore();
		fsReadFileSyncSpy.mockRestore();
	});
	it("should restore .env from backup and exit when envReconfigure is false", async () => {
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			envReconfigure: false,
		});

		// Mock fs.promises methods instead of sync methods
		const fsAccessSpy = vi
			.spyOn(fs.promises, "access")
			.mockResolvedValue(undefined);
		const fsReaddirSpy = vi
			.spyOn(fs.promises, "readdir")
			.mockResolvedValue([
				".env.1600000000",
				".env.1700000000",
			] as unknown as Awaited<ReturnType<typeof fs.promises.readdir>>);
		const fsCopyFileSpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);

		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);

		await expect(SetupModule.setup()).rejects.toThrow("process.exit called");
		expect(processExitSpy).toHaveBeenCalledWith(0);

		expect(fsCopyFileSpy).not.toHaveBeenCalled();

		processExitSpy.mockRestore();
		fsExistsSyncSpy.mockRestore();
		fsAccessSpy.mockRestore();
		fsReaddirSpy.mockRestore();
		fsCopyFileSpy.mockRestore();
	});

	// TODO: Re-enable when SIGINT handling can be tested without aborting Vitest runner
	// Skipped because process.emit('SIGINT') causes the test runner to abort with exit code 130
	it.skip("should restore .env on SIGINT (Ctrl+C) and exit with code 0 when backup exists", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Mock fs.promises methods for restoreLatestBackup
		const fsCopyFileSpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);
		const fsAccessSpy = vi
			.spyOn(fs.promises, "access")
			.mockImplementation(async (path) => {
				if (String(path) === ".backup") return undefined;
				throw { code: "ENOENT" };
			});
		const fsReaddirSpy = vi
			.spyOn(fs.promises, "readdir")
			.mockResolvedValue([
				".env.1600000000",
				".env.1700000000",
			] as unknown as Awaited<ReturnType<typeof fs.promises.readdir>>);

		// Mock envFileBackup to return true (backup was created)
		vi.mocked(envFileBackup).mockResolvedValue(true);

		// Mock file system to indicate .env file exists
		vi.spyOn(fs, "existsSync").mockReturnValue(true);

		// Mock all prompts
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultCloudbeaver: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			setupReCaptcha: false,
		});

		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		// Start setup() which will register the SIGINT handler and create backup
		const setupPromise = setup();

		// Wait deterministically for SIGINT handler to be registered
		const maxWaitTime = 5000; // 5 seconds max
		const pollInterval = 10; // Check every 10ms
		const startTime = Date.now();
		while (
			process.listenerCount("SIGINT") === 0 &&
			Date.now() - startTime < maxWaitTime
		) {
			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}

		// Verify handler was registered
		expect(process.listenerCount("SIGINT")).toBeGreaterThan(0);

		// Emit SIGINT to trigger the handler
		await expect(async () => process.emit("SIGINT")).rejects.toThrow(
			"process.exit called",
		);

		// Check that restoreLatestBackup was called
		expect(fsCopyFileSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env",
		);
		// Check new SIGINT handler messages
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\n⚠️  Setup interrupted by user (CTRL+C)",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ Original configuration restored successfully",
		);
		// Should exit with 0 when restoration succeeds
		expect(processExitSpy).toHaveBeenCalledWith(0);

		// Clean up: restore mocks and handle the setup promise rejection
		consoleLogSpy.mockRestore();
		processExitSpy.mockRestore();
		fsCopyFileSpy.mockRestore();
		fsAccessSpy.mockRestore();
		fsReaddirSpy.mockRestore();

		// The setup promise will reject because process.exit was called
		// Catch the rejection to prevent unhandled promise rejection warnings
		setupPromise.catch(() => {
			// Expected - setup was interrupted
		});
	});

	// TODO: Re-enable when SIGINT handling can be tested without aborting Vitest runner
	// Skipped because process.emit('SIGINT') causes the test runner to abort with exit code 130
	it.skip("should exit with code 1 when restoreLatestBackup fails", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// Mock fs.promises methods for restoreLatestBackup to throw an error
		const fsAccessSpy = vi
			.spyOn(fs.promises, "access")
			.mockImplementation(async (path) => {
				if (String(path) === ".backup") return undefined;
				throw { code: "ENOENT" };
			});
		const fsReaddirSpy = vi
			.spyOn(fs.promises, "readdir")
			.mockRejectedValue(new Error("Failed to read backup directory"));

		// Mock envFileBackup to return true (backup was created)
		vi.mocked(envFileBackup).mockResolvedValue(true);

		// Mock file system to indicate .env file exists
		vi.spyOn(fs, "existsSync").mockReturnValue(true);

		// Mock all prompts
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultCloudbeaver: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			setupReCaptcha: false,
		});

		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		// Start setup() which will register the SIGINT handler and create backup
		const setupPromise = setup();

		// Wait deterministically for SIGINT handler to be registered
		const maxWaitTime = 5000; // 5 seconds max
		const pollInterval = 10; // Check every 10ms
		const startTime = Date.now();
		while (
			process.listenerCount("SIGINT") === 0 &&
			Date.now() - startTime < maxWaitTime
		) {
			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}

		// Verify handler was registered
		expect(process.listenerCount("SIGINT")).toBeGreaterThan(0);

		// Emit SIGINT to trigger the handler
		await expect(async () => process.emit("SIGINT")).rejects.toThrow(
			"process.exit called",
		);

		// Check that error messages are shown
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"❌ Failed to restore backup:",
			expect.any(Error),
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"\n   You may need to manually restore from the .backup directory",
		);
		// Should exit with 1 when restoration fails
		expect(processExitSpy).toHaveBeenCalledWith(1);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n⚠️  Cleanup incomplete - please check your .env file",
		);

		// Clean up: restore mocks and handle the setup promise rejection
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
		fsAccessSpy.mockRestore();
		fsReaddirSpy.mockRestore();

		// The setup promise will reject because process.exit was called
		// Catch the rejection to prevent unhandled promise rejection warnings
		setupPromise.catch(() => {
			// Expected - setup was interrupted
		});
	});

	it("should return false and skip restoration when cleanupInProgress is true", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		// Spy on file operations that would be performed during restoration
		const fsAccessSpy = vi.spyOn(fs.promises, "access");
		const fsReaddirSpy = vi.spyOn(fs.promises, "readdir");
		const fsCopyFileSpy = vi.spyOn(fs.promises, "copyFile");

		// Import test helpers
		const { __test__restoreBackup, __test__setCleanupInProgress } =
			await import("scripts/setup/setup");

		// Set cleanupInProgress to true to simulate concurrent cleanup attempt
		__test__setCleanupInProgress(true);

		// Call restoreBackup - it should return false immediately without attempting restoration
		const result = await __test__restoreBackup();

		// Verify it returned false (guard triggered)
		expect(result).toBe(false);

		// Verify restoreLatestBackup operations were NOT called (restoration skipped)
		// These are the file operations that restoreLatestBackup would perform
		expect(fsAccessSpy).not.toHaveBeenCalled();
		expect(fsReaddirSpy).not.toHaveBeenCalled();
		expect(fsCopyFileSpy).not.toHaveBeenCalled();

		// Verify no console logs about restoration
		expect(consoleLogSpy).not.toHaveBeenCalledWith(
			"✅ Original configuration restored successfully",
		);
		expect(consoleLogSpy).not.toHaveBeenCalledWith(
			"📋 No backup was created yet, nothing to restore",
		);

		// Clean up: reset cleanupInProgress
		__test__setCleanupInProgress(false);
		consoleLogSpy.mockRestore();
		fsAccessSpy.mockRestore();
		fsReaddirSpy.mockRestore();
		fsCopyFileSpy.mockRestore();
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
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			setupReCaptcha: false,
			setupOAuth: false,
			setupMetrics: false,
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
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			setupReCaptcha: false,
			setupOAuth: false,
			setupMetrics: false,
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
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultCloudbeaver: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			setupReCaptcha: false,
			setupOAuth: false,
			setupMetrics: false,
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
		promptMock.mockResolvedValueOnce({ useDefaultApi: true });
		promptMock.mockResolvedValueOnce({ useDefaultMinio: true });
		promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: true });
		promptMock.mockResolvedValueOnce({ useDefaultPostgres: true });
		promptMock.mockResolvedValueOnce({ useDefaultCaddy: true });
		promptMock.mockResolvedValueOnce({
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});
		promptMock.mockResolvedValueOnce({ setupReCaptcha: false });
		promptMock.mockResolvedValueOnce({ setupOAuth: false });
		promptMock.mockResolvedValueOnce({ setupMetrics: false });

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
		promptMock.mockResolvedValueOnce({ useDefaultApi: true });
		promptMock.mockResolvedValueOnce({ useDefaultMinio: true });
		promptMock.mockResolvedValueOnce({ useDefaultCloudbeaver: true });
		promptMock.mockResolvedValueOnce({ useDefaultPostgres: true });
		promptMock.mockResolvedValueOnce({ useDefaultCaddy: true });
		promptMock.mockResolvedValueOnce({
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});
		promptMock.mockResolvedValueOnce({ setupReCaptcha: false });
		promptMock.mockResolvedValueOnce({ setupOAuth: false });
		promptMock.mockResolvedValueOnce({ setupMetrics: false });

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
describe("Validation Helpers", () => {
	let isBooleanString: typeof import("scripts/setup/validators").isBooleanString;
	let validateRequiredFields: typeof import("scripts/setup/validators").validateRequiredFields;
	let validateBooleanFields: typeof import("scripts/setup/validators").validateBooleanFields;
	let validatePortNumbers: typeof import("scripts/setup/validators").validatePortNumbers;
	let validateAllAnswers: typeof import("scripts/setup/validators").validateAllAnswers;
	type SetupAnswers = import("scripts/setup/types").SetupAnswers;

	beforeAll(async () => {
		const module = await import("scripts/setup/validators");
		isBooleanString = module.isBooleanString;
		validateRequiredFields = module.validateRequiredFields;
		validateBooleanFields = module.validateBooleanFields;
		validatePortNumbers = module.validatePortNumbers;
		validateAllAnswers = module.validateAllAnswers;
	});

	describe("isBooleanString", () => {
		it("should return true for 'true' string", () => {
			expect(isBooleanString("true")).toBe(true);
		});

		it("should return true for 'false' string", () => {
			expect(isBooleanString("false")).toBe(true);
		});

		it("should return false for 'yes' string", () => {
			expect(isBooleanString("yes")).toBe(false);
		});

		it("should return false for 'no' string", () => {
			expect(isBooleanString("no")).toBe(false);
		});

		it('should return false for numeric string "1"', () => {
			expect(isBooleanString("1")).toBe(false);
		});

		it('should return false for numeric string "0"', () => {
			expect(isBooleanString("0")).toBe(false);
		});

		it('should return false for string "null"', () => {
			expect(isBooleanString("null")).toBe(false);
		});

		it('should return false for string "undefined"', () => {
			expect(isBooleanString("undefined")).toBe(false);
		});

		it("should return false for empty string", () => {
			expect(isBooleanString("")).toBe(false);
		});

		it("should return false for numeric primitive 1", () => {
			expect(isBooleanString(1)).toBe(false);
		});

		it("should return false for numeric primitive 0", () => {
			expect(isBooleanString(0)).toBe(false);
		});

		it("should return false for null primitive", () => {
			expect(isBooleanString(null)).toBe(false);
		});

		it("should return false for undefined primitive", () => {
			expect(isBooleanString(undefined)).toBe(false);
		});

		it("should return false for boolean primitive true", () => {
			expect(isBooleanString(true)).toBe(false);
		});

		it("should return false for boolean primitive false", () => {
			expect(isBooleanString(false)).toBe(false);
		});
	});

	describe("validateRequiredFields", () => {
		it("should not throw when both CI and API_ADMINISTRATOR_USER_EMAIL_ADDRESS are set", () => {
			const answers: SetupAnswers = {
				CI: "true",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@example.com",
			};

			expect(() => validateRequiredFields(answers)).not.toThrow();
		});

		it("should throw when CI is missing", () => {
			const answers: SetupAnswers = {
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@example.com",
			};

			expect(() => validateRequiredFields(answers)).toThrow(
				"Missing required configuration fields",
			);
			expect(() => validateRequiredFields(answers)).toThrow("CI");
		});

		it("should throw when API_ADMINISTRATOR_USER_EMAIL_ADDRESS is missing", () => {
			const answers: SetupAnswers = {
				CI: "false",
			};

			expect(() => validateRequiredFields(answers)).toThrow(
				"Missing required configuration fields",
			);
			expect(() => validateRequiredFields(answers)).toThrow(
				"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			);
		});

		it("should throw when CI is empty string", () => {
			const answers = {
				CI: "",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@example.com",
			} as unknown as SetupAnswers;

			expect(() => validateRequiredFields(answers)).toThrow("CI");
		});

		it("should throw when API_ADMINISTRATOR_USER_EMAIL_ADDRESS is empty string", () => {
			const answers: SetupAnswers = {
				CI: "true",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "",
			};

			expect(() => validateRequiredFields(answers)).toThrow(
				"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			);
		});

		it("should list all missing fields when both are missing", () => {
			const answers: SetupAnswers = {};

			expect(() => validateRequiredFields(answers)).toThrow("CI");
			expect(() => validateRequiredFields(answers)).toThrow(
				"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			);
		});
	});

	describe("validateBooleanFields", () => {
		it("should not throw when all boolean fields are set to 'true'", () => {
			const answers: SetupAnswers = {
				CI: "true",
				API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
				API_IS_GRAPHIQL: "true",
				API_IS_PINO_PRETTY: "true",
				API_MINIO_USE_SSL: "true",
				API_POSTGRES_SSL_MODE: "true",
			};

			expect(() => validateBooleanFields(answers)).not.toThrow();
		});

		it("should not throw when all boolean fields are set to 'false'", () => {
			const answers: SetupAnswers = {
				CI: "false",
				API_IS_APPLY_DRIZZLE_MIGRATIONS: "false",
				API_IS_GRAPHIQL: "false",
				API_IS_PINO_PRETTY: "false",
				API_MINIO_USE_SSL: "false",
				API_POSTGRES_SSL_MODE: "false",
			};

			expect(() => validateBooleanFields(answers)).not.toThrow();
		});

		it("should not throw when boolean fields are undefined", () => {
			const answers: SetupAnswers = {};

			expect(() => validateBooleanFields(answers)).not.toThrow();
		});

		it("should throw when a boolean field is set to 'yes'", () => {
			const answers = {
				CI: "yes",
			} as unknown as SetupAnswers;

			expect(() => validateBooleanFields(answers)).toThrow(
				'Boolean fields must be "true" or "false"',
			);
			expect(() => validateBooleanFields(answers)).toThrow("CI");
		});

		it("should throw when a boolean field is set to numeric 1", () => {
			const answers = {
				API_IS_GRAPHIQL: 1,
			} as unknown as SetupAnswers;

			expect(() => validateBooleanFields(answers)).toThrow("API_IS_GRAPHIQL");
		});

		it("should throw when a boolean field is set to null", () => {
			const answers = {
				API_MINIO_USE_SSL: null,
			} as unknown as SetupAnswers;

			expect(() => validateBooleanFields(answers)).toThrow("API_MINIO_USE_SSL");
		});

		it("should list all invalid boolean fields in error", () => {
			const answers = {
				CI: "yes",
				API_IS_GRAPHIQL: "no",
			} as unknown as SetupAnswers;

			expect(() => validateBooleanFields(answers)).toThrow("CI");
			expect(() => validateBooleanFields(answers)).toThrow("API_IS_GRAPHIQL");
		});
	});

	describe("validatePortNumbers", () => {
		it("should not throw for minimum valid port (1)", () => {
			const answers: SetupAnswers = {
				API_PORT: "1",
			};

			expect(() => validatePortNumbers(answers)).not.toThrow();
		});

		it("should not throw for maximum valid port (65535)", () => {
			const answers: SetupAnswers = {
				API_PORT: "65535",
			};

			expect(() => validatePortNumbers(answers)).not.toThrow();
		});

		it("should not throw when port fields are undefined", () => {
			const answers: SetupAnswers = {};

			expect(() => validatePortNumbers(answers)).not.toThrow();
		});

		it("should not throw for typical valid ports", () => {
			const answers: SetupAnswers = {
				API_PORT: "4000",
				API_MINIO_PORT: "9000",
				API_POSTGRES_PORT: "5432",
				CADDY_HTTP_MAPPED_PORT: "80",
				CADDY_HTTPS_MAPPED_PORT: "443",
			};

			expect(() => validatePortNumbers(answers)).not.toThrow();
		});

		it("should throw for port 0", () => {
			const answers: SetupAnswers = {
				API_PORT: "0",
			};

			expect(() => validatePortNumbers(answers)).toThrow(
				"Port numbers must be between 1 and 65535",
			);
			expect(() => validatePortNumbers(answers)).toThrow("API_PORT");
		});

		it("should throw for port 65536", () => {
			const answers: SetupAnswers = {
				API_PORT: "65536",
			};

			expect(() => validatePortNumbers(answers)).toThrow("API_PORT");
		});

		it("should throw for negative port", () => {
			const answers: SetupAnswers = {
				API_PORT: "-1",
			};

			expect(() => validatePortNumbers(answers)).toThrow("API_PORT");
		});

		it("should throw for non-numeric port value", () => {
			const answers: SetupAnswers = {
				API_PORT: "abc",
			};

			expect(() => validatePortNumbers(answers)).toThrow("API_PORT");
		});

		it("should throw for empty string port value", () => {
			const answers: SetupAnswers = {
				API_PORT: "",
			};

			expect(() => validatePortNumbers(answers)).toThrow("API_PORT");
		});

		it("should list all invalid ports in error", () => {
			const answers: SetupAnswers = {
				API_PORT: "0",
				API_MINIO_PORT: "99999",
				API_POSTGRES_PORT: "abc",
			};

			expect(() => validatePortNumbers(answers)).toThrow("API_PORT");
			expect(() => validatePortNumbers(answers)).toThrow("API_MINIO_PORT");
			expect(() => validatePortNumbers(answers)).toThrow("API_POSTGRES_PORT");
		});
	});

	describe("validateAllAnswers", () => {
		let consoleLogSpy: MockInstance;

		beforeEach(() => {
			consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		});

		afterEach(() => {
			consoleLogSpy.mockRestore();
		});

		it("should pass validation and emit console messages for valid config", () => {
			const answers: SetupAnswers = {
				CI: "false",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
				API_PORT: "4000",
				API_IS_GRAPHIQL: "true",
			};

			expect(() => validateAllAnswers(answers)).not.toThrow();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"\n📋 Validating configuration...",
			);
			expect(consoleLogSpy).toHaveBeenCalledWith("✅ All validations passed");
		});

		it("should bubble up validateRequiredFields error", () => {
			const answers: SetupAnswers = {
				API_PORT: "4000",
			};

			expect(() => validateAllAnswers(answers)).toThrow(
				"Missing required configuration fields",
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"\n📋 Validating configuration...",
			);
		});

		it("should bubble up validateBooleanFields error", () => {
			const answers = {
				CI: "yes",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
			} as unknown as SetupAnswers;

			expect(() => validateAllAnswers(answers)).toThrow(
				'Boolean fields must be "true" or "false"',
			);
		});

		it("should bubble up validatePortNumbers error", () => {
			const answers: SetupAnswers = {
				CI: "true",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
				API_PORT: "99999",
			};

			expect(() => validateAllAnswers(answers)).toThrow(
				"Port numbers must be between 1 and 65535",
			);
		});

		it("should not emit success message when validation fails", () => {
			const answers: SetupAnswers = {};

			expect(() => validateAllAnswers(answers)).toThrow();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"\n📋 Validating configuration...",
			);
			expect(consoleLogSpy).not.toHaveBeenCalledWith(
				"✅ All validations passed",
			);
		});
	});

	describe("observabilitySetup", () => {
		let observabilitySetup: typeof import("scripts/setup/services/apiSetup").observabilitySetup;
		type SetupAnswers = import("scripts/setup/types").SetupAnswers;

		beforeAll(async () => {
			const module = await import("scripts/setup/services/apiSetup");
			observabilitySetup = module.observabilitySetup;
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("prompts for sampling ratio when observability is enabled", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({
				API_OTEL_ENABLED: "true",
			});

			promptMock.mockResolvedValueOnce({
				API_OTEL_SAMPLING_RATIO: "0.5",
			});

			const answers: SetupAnswers = {};

			const result = await observabilitySetup(answers);

			expect(promptMock).toHaveBeenCalledTimes(2);
			expect(result.API_OTEL_ENABLED).toBe("true");
			expect(result.API_OTEL_SAMPLING_RATIO).toBe("0.5");
		});

		it("does not prompt for sampling ratio when observability is disabled", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({
				API_OTEL_ENABLED: "false",
			});

			const answers: SetupAnswers = {};

			const result = await observabilitySetup(answers);

			expect(promptMock).toHaveBeenCalledTimes(1);
			expect(result.API_OTEL_ENABLED).toBe("false");
			expect(result.API_OTEL_SAMPLING_RATIO).toBeUndefined();
		});

		it("preserves existing answers", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({
				API_OTEL_ENABLED: "false",
			});

			const answers: SetupAnswers = {
				CI: "true",
			};

			const result = await observabilitySetup(answers);

			expect(result.CI).toBe("true");
			expect(result.API_OTEL_ENABLED).toBe("false");
		});
	});

	describe("validateSamplingRatio", () => {
		let validateSamplingRatio: typeof import("scripts/setup/validators").validateSamplingRatio;

		beforeAll(async () => {
			const module = await import("scripts/setup/validators");
			validateSamplingRatio = module.validateSamplingRatio;
		});

		it("returns true for valid ratios", () => {
			expect(validateSamplingRatio("0")).toBe(true);
			expect(validateSamplingRatio("1")).toBe(true);
			expect(validateSamplingRatio("0.5")).toBe(true);
		});

		it("returns error message for invalid ratios", () => {
			expect(validateSamplingRatio("-1")).toBe(
				"Please enter valid sampling ratio (0-1).",
			);
			expect(validateSamplingRatio("1.1")).toBe(
				"Please enter valid sampling ratio (0-1).",
			);
			expect(validateSamplingRatio("abc")).toBe(
				"Please enter valid sampling ratio (0-1).",
			);
		});
	});

	describe("metricsSetup", () => {
		let metricsSetup: typeof import("scripts/setup/setup").metricsSetup;
		type SetupAnswers = import("scripts/setup/types").SetupAnswers;

		beforeAll(async () => {
			const module = await import("scripts/setup/setup");
			metricsSetup = module.metricsSetup;
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("returns answers immediately when metrics is disabled", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({
				API_METRICS_ENABLED: "false",
			});

			const answers: SetupAnswers = {};

			const result = await metricsSetup(answers);

			expect(promptMock).toHaveBeenCalledTimes(1);
			expect(result.API_METRICS_ENABLED).toBe("false");
			expect(result.API_METRICS_SLOW_REQUEST_MS).toBeUndefined();
		});

		it("prompts for all settings when metrics and aggregation are enabled", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({ API_METRICS_ENABLED: "true" });
			promptMock.mockResolvedValueOnce({ API_METRICS_API_KEY: "test-key" });
			promptMock.mockResolvedValueOnce({ API_METRICS_SLOW_REQUEST_MS: "500" });
			promptMock.mockResolvedValueOnce({
				API_METRICS_SLOW_OPERATION_MS: "200",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_AGGREGATION_ENABLED: "true",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_AGGREGATION_CRON_SCHEDULE: "*/5 * * * *",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_AGGREGATION_WINDOW_MINUTES: "5",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_CACHE_TTL_SECONDS: "300",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_SNAPSHOT_RETENTION_COUNT: "1000",
			});

			const answers: SetupAnswers = {};

			const result = await metricsSetup(answers);

			expect(promptMock).toHaveBeenCalledTimes(9);
			expect(result.API_METRICS_ENABLED).toBe("true");
			expect(result.API_METRICS_API_KEY).toBe("test-key");
			expect(result.API_METRICS_SLOW_REQUEST_MS).toBe("500");
			expect(result.API_METRICS_SLOW_OPERATION_MS).toBe("200");
			expect(result.API_METRICS_AGGREGATION_ENABLED).toBe("true");
			expect(result.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBe("*/5 * * * *");
			expect(result.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBe("5");
			expect(result.API_METRICS_CACHE_TTL_SECONDS).toBe("300");
			expect(result.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe("1000");
		});

		it("skips aggregation settings when aggregation is disabled", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({ API_METRICS_ENABLED: "true" });
			promptMock.mockResolvedValueOnce({ API_METRICS_API_KEY: "" });
			promptMock.mockResolvedValueOnce({ API_METRICS_SLOW_REQUEST_MS: "500" });
			promptMock.mockResolvedValueOnce({
				API_METRICS_SLOW_OPERATION_MS: "200",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_AGGREGATION_ENABLED: "false",
			});
			promptMock.mockResolvedValueOnce({
				API_METRICS_SNAPSHOT_RETENTION_COUNT: "1000",
			});

			const answers: SetupAnswers = {};

			const result = await metricsSetup(answers);

			expect(promptMock).toHaveBeenCalledTimes(6);
			expect(result.API_METRICS_ENABLED).toBe("true");
			// Empty API key should not be persisted (undefined for schema validation)
			expect(result.API_METRICS_API_KEY).toBeUndefined();
			expect(result.API_METRICS_AGGREGATION_ENABLED).toBe("false");
			expect(result.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBeUndefined();
			expect(result.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBeUndefined();
			expect(result.API_METRICS_CACHE_TTL_SECONDS).toBeUndefined();
			expect(result.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe("1000");
		});

		it("preserves existing answers", async () => {
			const promptMock = vi.spyOn(inquirer, "prompt");

			promptMock.mockResolvedValueOnce({
				API_METRICS_ENABLED: "false",
			});

			const answers: SetupAnswers = {
				CI: "true",
				API_PORT: "4000",
			};

			const result = await metricsSetup(answers);

			expect(result.CI).toBe("true");
			expect(result.API_PORT).toBe("4000");
			expect(result.API_METRICS_ENABLED).toBe("false");
		});
	});

	describe("validatePositiveInteger", () => {
		let validatePositiveInteger: typeof import("scripts/setup/validators").validatePositiveInteger;

		beforeAll(async () => {
			const module = await import("scripts/setup/validators");
			validatePositiveInteger = module.validatePositiveInteger;
		});

		it("returns true for valid positive integers", () => {
			expect(validatePositiveInteger("1")).toBe(true);
			expect(validatePositiveInteger("100")).toBe(true);
			expect(validatePositiveInteger("999999")).toBe(true);
		});

		it("returns error message for zero", () => {
			expect(validatePositiveInteger("0")).toBe(
				"Please enter a valid positive integer.",
			);
		});

		it("returns error message for negative numbers", () => {
			expect(validatePositiveInteger("-1")).toBe(
				"Please enter a valid positive integer.",
			);
		});

		it("returns error message for non-numeric input", () => {
			expect(validatePositiveInteger("abc")).toBe(
				"Please enter a valid positive integer.",
			);
		});

		it("returns error message for decimal numbers", () => {
			expect(validatePositiveInteger("1.5")).toBe(
				"Please enter a valid positive integer.",
			);
		});

		it("returns error message for trailing characters", () => {
			expect(validatePositiveInteger("1abc")).toBe(
				"Please enter a valid positive integer.",
			);
			expect(validatePositiveInteger("123a")).toBe(
				"Please enter a valid positive integer.",
			);
		});
	});

	describe("validateCronExpression", () => {
		let validateCronExpression: typeof import("scripts/setup/validators").validateCronExpression;

		beforeAll(async () => {
			const module = await import("scripts/setup/validators");
			validateCronExpression = module.validateCronExpression;
		});

		it("returns true for valid cron expressions", () => {
			expect(validateCronExpression("*/5 * * * *")).toBe(true);
			expect(validateCronExpression("0 */2 * * *")).toBe(true);
			expect(validateCronExpression("0 0 * * *")).toBe(true);
			expect(validateCronExpression("30 4 1 * 0")).toBe(true);
		});

		it("returns error message for empty cron expression", () => {
			expect(validateCronExpression("")).toBe(
				"Cron expression cannot be empty.",
			);
		});

		it("returns error message for invalid cron expressions", () => {
			expect(validateCronExpression("not a cron")).toContain(
				"Please enter a valid cron expression",
			);
			expect(validateCronExpression("* *")).toContain(
				"Please enter a valid cron expression",
			);
			// Regression test: reversed ranges should be rejected
			expect(validateCronExpression("5-1 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
		});

		it("returns true for valid comma-separated cron tokens", () => {
			expect(validateCronExpression("1,2,3 * * * *")).toBe(true);
			expect(validateCronExpression("0,30 * * * *")).toBe(true);
			expect(validateCronExpression("0 0,12 * * *")).toBe(true);
			expect(validateCronExpression("0 0 1,15 * *")).toBe(true);
		});

		it("returns error message for invalid comma-separated cron tokens", () => {
			// Out of range minute
			expect(validateCronExpression("61,1 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Negative value
			expect(validateCronExpression("1,-2 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Out of range hour
			expect(validateCronExpression("0 24,1 * * *")).toContain(
				"Please enter a valid cron expression",
			);
		});

		it("returns true for valid range (start-end) tokens", () => {
			expect(validateCronExpression("2-5 * * * *")).toBe(true);
			expect(validateCronExpression("0 0-12 * * *")).toBe(true);
			expect(validateCronExpression("0 0 1-31 * *")).toBe(true);
			expect(validateCronExpression("0 0 * 1-12 *")).toBe(true);
			expect(validateCronExpression("0 0 * * 0-6")).toBe(true);
		});

		it("returns error message for invalid range tokens", () => {
			// Reversed range (start > end)
			expect(validateCronExpression("5-2 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Non-numeric range parts
			expect(validateCronExpression("a-3 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			expect(validateCronExpression("2-b * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Out of bounds range
			expect(validateCronExpression("60-65 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Range exceeding max for hour field
			expect(validateCronExpression("0 20-25 * * *")).toContain(
				"Please enter a valid cron expression",
			);
		});

		it("returns true for valid number/step tokens", () => {
			expect(validateCronExpression("3/2 * * * *")).toBe(true);
			expect(validateCronExpression("0/15 * * * *")).toBe(true);
			expect(validateCronExpression("0 0/6 * * *")).toBe(true);
			expect(validateCronExpression("0 0 1/5 * *")).toBe(true);
		});

		it("returns error message for invalid number/step tokens", () => {
			// Step of 0 (invalid, step must be >= 1)
			expect(validateCronExpression("3/0 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Non-numeric step
			expect(validateCronExpression("3/x * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Non-numeric number
			expect(validateCronExpression("x/2 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
			// Number out of bounds for minute field
			expect(validateCronExpression("60/5 * * * *")).toContain(
				"Please enter a valid cron expression",
			);
		});
	});
});
