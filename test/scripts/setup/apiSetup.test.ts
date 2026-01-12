vi.mock("inquirer");

import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import {
	apiSetup,
	checkEnvFile,
	generateJwtSecret,
	type SetupAnswers,
	setup,
	validatePort,
	validateURL,
} from "scripts/setup/setup";
import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

describe("Setup -> apiSetup", () => {
	const originalEnv = { ...process.env };
	beforeAll(() => {
		dotenv.config({ path: ".env" });
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for API configuration and update environment variables", async () => {
		process.env.MINIO_ROOT_PASSWORD = "password";
		process.env.POSTGRES_PASSWORD = "password";
		const isEnvConfigured = await checkEnvFile();
		const mockResponses = [
			...(isEnvConfigured ? [{ envReconfigure: true }] : []),
			{ CI: "true" },
			{ useDefaultMinio: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ useDefaultApi: false },
			{ API_BASE_URL: "http://localhost:5000" },
			{ API_HOST: "127.0.0.1" },
			{ API_PORT: "5000" },
			{ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" },
			{ API_IS_GRAPHIQL: "false" },
			{ API_IS_PINO_PRETTY: "false" },
			{ API_JWT_EXPIRES_IN: "3600000" },
			{ API_JWT_SECRET: "mocked-secret" },
			{ API_LOG_LEVEL: "info" },
			{ API_MINIO_ACCESS_KEY: "mocked-access-key" },
			{ API_MINIO_END_POINT: "mocked-endpoint" },
			{ API_MINIO_PORT: "9001" },
			{ API_MINIO_SECRET_KEY: "password" },
			{ API_MINIO_TEST_END_POINT: "mocked-test-endpoint" },
			{ API_MINIO_USE_SSL: "true" },
			{ API_POSTGRES_DATABASE: "mocked-database" },
			{ API_POSTGRES_HOST: "mocked-host" },
			{ API_POSTGRES_PASSWORD: "password" },
			{ API_POSTGRES_PORT: "5433" },
			{ API_POSTGRES_SSL_MODE: "true" },
			{ API_POSTGRES_TEST_HOST: "mocked-test-host" },
			{ API_POSTGRES_USER: "mocked-user" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");

		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const answers = await setup();

		const expectedEnv = {
			API_BASE_URL: "http://localhost:5000",
			API_HOST: "127.0.0.1",
			API_PORT: "5000",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
			API_IS_GRAPHIQL: "false",
			API_IS_PINO_PRETTY: "false",
			API_JWT_EXPIRES_IN: "3600000",
			API_JWT_SECRET: "mocked-secret",
			API_LOG_LEVEL: "info",
			API_MINIO_ACCESS_KEY: "mocked-access-key",
			API_MINIO_END_POINT: "mocked-endpoint",
			API_MINIO_PORT: "9001",
			API_MINIO_SECRET_KEY: "password",
			API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			API_MINIO_USE_SSL: "true",
			API_POSTGRES_DATABASE: "mocked-database",
			API_POSTGRES_HOST: "mocked-host",
			API_POSTGRES_PASSWORD: "password",
			API_POSTGRES_PORT: "5433",
			API_POSTGRES_SSL_MODE: "true",
			API_POSTGRES_TEST_HOST: "mocked-test-host",
			API_POSTGRES_USER: "mocked-user",
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});

	it("should handle prompt errors correctly", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path === ".backup") return true;
			return false;
		});
		(
			vi.spyOn(fs, "readdirSync") as unknown as MockInstance<
				(path: fs.PathLike) => string[]
			>
		).mockImplementation(() => [".env.1600000000", ".env.1700000000"]);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await apiSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSyncSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});

	it("should prompt the user until mandatory parameters match", async () => {
		process.env.POSTGRES_PASSWORD = "password";
		process.env.MINIO_ROOT_PASSWORD = "password";

		const promptMock = vi.spyOn(inquirer, "prompt");

		// First response is incorrect, second response is correct
		promptMock
			.mockResolvedValueOnce({ API_BASE_URL: "http://localhost:5000" })
			.mockResolvedValueOnce({ API_HOST: "127.0.0.1" })
			.mockResolvedValueOnce({ API_PORT: "5000" })
			.mockResolvedValueOnce({ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" })
			.mockResolvedValueOnce({ API_IS_GRAPHIQL: "true" })
			.mockResolvedValueOnce({ API_IS_PINO_PRETTY: "false" })
			.mockResolvedValueOnce({ API_JWT_EXPIRES_IN: "3600000" })
			.mockResolvedValueOnce({ API_JWT_SECRET: "mocked-secret" })
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-test-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "mocked-secret-key" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "password" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_DATABASE: "mocked-database" })
			.mockResolvedValueOnce({ API_POSTGRES_HOST: "mocked-host" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "postgres-password" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "password" })
			.mockResolvedValueOnce({ API_POSTGRES_PORT: "5433" })
			.mockResolvedValueOnce({ API_POSTGRES_SSL_MODE: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_TEST_HOST: "mocked-test-host" })
			.mockResolvedValueOnce({ API_POSTGRES_USER: "mocked-user" });
		const consoleLogSpy = vi.spyOn(console, "log");
		const consoleWarnSpy = vi.spyOn(console, "warn");

		let answers: SetupAnswers = {};
		answers = await apiSetup(answers);

		// Verify user is prompted twice because first attempt was incorrect
		expect(promptMock).toHaveBeenCalledTimes(24);
		expect(answers.API_POSTGRES_PASSWORD).toBe("password");

		// Verify warning message was shown
		expect(consoleWarnSpy.mock.calls).toEqual([
			["⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD."],
			["⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD."],
		]);

		// Verify success messages on match
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ API_MINIO_SECRET_KEY matches MINIO_ROOT_PASSWORD",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ API_POSTGRES_PASSWORD matches POSTGRES_PASSWORD",
		);
	});

	it("should complete successfully in fresh environment without environment variables set", async () => {
		// Ensure both environment variables are not set
		delete process.env.MINIO_ROOT_PASSWORD;
		delete process.env.POSTGRES_PASSWORD;

		const promptMock = vi.spyOn(inquirer, "prompt");
		const consoleLogSpy = vi.spyOn(console, "log");
		const consoleWarnSpy = vi.spyOn(console, "warn");

		// Mock all required prompts
		promptMock
			.mockResolvedValueOnce({ API_BASE_URL: "http://localhost:5000" })
			.mockResolvedValueOnce({ API_HOST: "127.0.0.1" })
			.mockResolvedValueOnce({ API_PORT: "5000" })
			.mockResolvedValueOnce({ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" })
			.mockResolvedValueOnce({ API_IS_GRAPHIQL: "true" })
			.mockResolvedValueOnce({ API_IS_PINO_PRETTY: "false" })
			.mockResolvedValueOnce({ API_JWT_EXPIRES_IN: "3600000" })
			.mockResolvedValueOnce({ API_JWT_SECRET: "mocked-secret" })
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "my-secret-key" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_DATABASE: "mocked-database" })
			.mockResolvedValueOnce({ API_POSTGRES_HOST: "mocked-host" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "my-postgres-password" })
			.mockResolvedValueOnce({ API_POSTGRES_PORT: "5433" })
			.mockResolvedValueOnce({ API_POSTGRES_SSL_MODE: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_TEST_HOST: "mocked-test-host" })
			.mockResolvedValueOnce({ API_POSTGRES_USER: "mocked-user" });

		let answers: SetupAnswers = {};
		answers = await apiSetup(answers);

		// Verify setup completes successfully
		expect(answers.API_MINIO_SECRET_KEY).toBe("my-secret-key");
		expect(answers.API_POSTGRES_PASSWORD).toBe("my-postgres-password");

		// Verify informative messages are logged when env vars are not set
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"ℹ️  MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"ℹ️  POSTGRES_PASSWORD will be set to match API_POSTGRES_PASSWORD",
		);

		// Verify no warnings are shown
		expect(consoleWarnSpy).not.toHaveBeenCalled();
	});

	it("should validate MinIO secret key when MINIO_ROOT_PASSWORD is set", async () => {
		process.env.MINIO_ROOT_PASSWORD = "expected-password";
		delete process.env.POSTGRES_PASSWORD;

		const promptMock = vi.spyOn(inquirer, "prompt");
		const consoleLogSpy = vi.spyOn(console, "log");
		const consoleWarnSpy = vi.spyOn(console, "warn");

		// First provide mismatched password, then matching password
		promptMock
			.mockResolvedValueOnce({ API_BASE_URL: "http://localhost:5000" })
			.mockResolvedValueOnce({ API_HOST: "127.0.0.1" })
			.mockResolvedValueOnce({ API_PORT: "5000" })
			.mockResolvedValueOnce({ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" })
			.mockResolvedValueOnce({ API_IS_GRAPHIQL: "true" })
			.mockResolvedValueOnce({ API_IS_PINO_PRETTY: "false" })
			.mockResolvedValueOnce({ API_JWT_EXPIRES_IN: "3600000" })
			.mockResolvedValueOnce({ API_JWT_SECRET: "mocked-secret" })
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "wrong-password" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "expected-password" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_DATABASE: "mocked-database" })
			.mockResolvedValueOnce({ API_POSTGRES_HOST: "mocked-host" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "my-postgres-password" })
			.mockResolvedValueOnce({ API_POSTGRES_PORT: "5433" })
			.mockResolvedValueOnce({ API_POSTGRES_SSL_MODE: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_TEST_HOST: "mocked-test-host" })
			.mockResolvedValueOnce({ API_POSTGRES_USER: "mocked-user" });

		let answers: SetupAnswers = {};
		answers = await apiSetup(answers);

		// Verify validation succeeded
		expect(answers.API_MINIO_SECRET_KEY).toBe("expected-password");

		// Verify warning was shown for mismatch
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD.",
		);

		// Verify success message on match
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ API_MINIO_SECRET_KEY matches MINIO_ROOT_PASSWORD",
		);

		// Verify informative message for POSTGRES_PASSWORD (not set)
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"ℹ️  POSTGRES_PASSWORD will be set to match API_POSTGRES_PASSWORD",
		);
	});

	it("should validate PostgreSQL password when POSTGRES_PASSWORD is set", async () => {
		delete process.env.MINIO_ROOT_PASSWORD;
		process.env.POSTGRES_PASSWORD = "expected-postgres-password";

		const promptMock = vi.spyOn(inquirer, "prompt");
		const consoleLogSpy = vi.spyOn(console, "log");
		const consoleWarnSpy = vi.spyOn(console, "warn");

		// First provide mismatched password, then matching password
		promptMock
			.mockResolvedValueOnce({ API_BASE_URL: "http://localhost:5000" })
			.mockResolvedValueOnce({ API_HOST: "127.0.0.1" })
			.mockResolvedValueOnce({ API_PORT: "5000" })
			.mockResolvedValueOnce({ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" })
			.mockResolvedValueOnce({ API_IS_GRAPHIQL: "true" })
			.mockResolvedValueOnce({ API_IS_PINO_PRETTY: "false" })
			.mockResolvedValueOnce({ API_JWT_EXPIRES_IN: "3600000" })
			.mockResolvedValueOnce({ API_JWT_SECRET: "mocked-secret" })
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "my-secret-key" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_DATABASE: "mocked-database" })
			.mockResolvedValueOnce({ API_POSTGRES_HOST: "mocked-host" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "wrong-password" })
			.mockResolvedValueOnce({
				API_POSTGRES_PASSWORD: "expected-postgres-password",
			})
			.mockResolvedValueOnce({ API_POSTGRES_PORT: "5433" })
			.mockResolvedValueOnce({ API_POSTGRES_SSL_MODE: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_TEST_HOST: "mocked-test-host" })
			.mockResolvedValueOnce({ API_POSTGRES_USER: "mocked-user" });

		let answers: SetupAnswers = {};
		answers = await apiSetup(answers);

		// Verify validation succeeded
		expect(answers.API_POSTGRES_PASSWORD).toBe("expected-postgres-password");

		// Verify warning was shown for mismatch
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD.",
		);

		// Verify success message on match
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ API_POSTGRES_PASSWORD matches POSTGRES_PASSWORD",
		);

		// Verify informative message for MINIO_ROOT_PASSWORD (not set)
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"ℹ️  MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
		);
	});

	it("should handle mismatched passwords correctly when both env vars are set", async () => {
		process.env.MINIO_ROOT_PASSWORD = "minio-password";
		process.env.POSTGRES_PASSWORD = "postgres-password";

		const promptMock = vi.spyOn(inquirer, "prompt");
		const consoleLogSpy = vi.spyOn(console, "log");
		const consoleWarnSpy = vi.spyOn(console, "warn");

		// Provide incorrect passwords first, then correct ones
		promptMock
			.mockResolvedValueOnce({ API_BASE_URL: "http://localhost:5000" })
			.mockResolvedValueOnce({ API_HOST: "127.0.0.1" })
			.mockResolvedValueOnce({ API_PORT: "5000" })
			.mockResolvedValueOnce({ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" })
			.mockResolvedValueOnce({ API_IS_GRAPHIQL: "true" })
			.mockResolvedValueOnce({ API_IS_PINO_PRETTY: "false" })
			.mockResolvedValueOnce({ API_JWT_EXPIRES_IN: "3600000" })
			.mockResolvedValueOnce({ API_JWT_SECRET: "mocked-secret" })
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "wrong-minio" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "minio-password" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_DATABASE: "mocked-database" })
			.mockResolvedValueOnce({ API_POSTGRES_HOST: "mocked-host" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "wrong-postgres" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "postgres-password" })
			.mockResolvedValueOnce({ API_POSTGRES_PORT: "5433" })
			.mockResolvedValueOnce({ API_POSTGRES_SSL_MODE: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_TEST_HOST: "mocked-test-host" })
			.mockResolvedValueOnce({ API_POSTGRES_USER: "mocked-user" });

		let answers: SetupAnswers = {};
		answers = await apiSetup(answers);

		// Verify validation succeeded with correct passwords
		expect(answers.API_MINIO_SECRET_KEY).toBe("minio-password");
		expect(answers.API_POSTGRES_PASSWORD).toBe("postgres-password");

		// Verify warnings were shown for mismatches
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD.",
		);
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD.",
		);

		// Verify success messages on match
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ API_MINIO_SECRET_KEY matches MINIO_ROOT_PASSWORD",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ API_POSTGRES_PASSWORD matches POSTGRES_PASSWORD",
		);

		// Verify no informative messages (env vars are set)
		expect(consoleLogSpy).not.toHaveBeenCalledWith(
			"ℹ️  MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
		);
		expect(consoleLogSpy).not.toHaveBeenCalledWith(
			"ℹ️  POSTGRES_PASSWORD will be set to match API_POSTGRES_PASSWORD",
		);
	});
});
describe("validateURL", () => {
	it("should validate standard URLs", () => {
		expect(validateURL("https://example.com")).toBe(true);
		expect(validateURL("http://localhost:3000")).toBe(true);
	});

	it("should validate URLs with complex components", () => {
		expect(validateURL("https://sub.example.com:8080/path")).toBe(true);
		expect(validateURL("http://sub.domain.example.com/path?query=1")).toBe(
			true,
		);
		expect(validateURL("https://example.com/path#fragment")).toBe(true);
	});

	it("should validate IP addresses", () => {
		expect(validateURL("http://127.0.0.1:4000")).toBe(true);
		expect(validateURL("https://[::1]:8080")).toBe(true);
		expect(validateURL("http://192.168.1.1")).toBe(true);
	});

	it("should reject invalid protocols", () => {
		expect(validateURL("ftp://example.com")).toBe(
			"Please enter a valid URL with http:// or https:// protocol.",
		);
		expect(validateURL("ws://example.com")).toBe(
			"Please enter a valid URL with http:// or https:// protocol.",
		);
	});

	it("should reject malformed URLs", () => {
		expect(validateURL("http://")).toBe("Please enter a valid URL.");
		expect(validateURL("http://example.com:abc")).toBe(
			"Please enter a valid URL.",
		);
		expect(validateURL(" ")).toBe("Please enter a valid URL.");
		expect(validateURL("")).toBe("Please enter a valid URL.");
	});

	it("should validate URLs with different case protocols and domains", () => {
		expect(validateURL("HTTPS://example.com")).toBe(true);
		expect(validateURL("HTTP://example.com")).toBe(true);

		expect(validateURL("HtTpS://example.com")).toBe(true);
		expect(validateURL("HtTp://example.com")).toBe(true);

		expect(validateURL("https://EXAMPLE.COM")).toBe(true);
		expect(validateURL("http://LOCALHOST:3000")).toBe(true);

		expect(validateURL("https://ExAmPlE.cOm")).toBe(true);
		expect(validateURL("http://LoCaLhOsT:3000")).toBe(true);

		expect(validateURL("HtTpS://ExAmPlE.cOm:8080/path")).toBe(true);
	});
});

describe("validatePort", () => {
	it("should return true for valid port numbers", () => {
		expect(validatePort("80")).toBe(true);
		expect(validatePort("443")).toBe(true);
		expect(validatePort("65535")).toBe(true);
		expect(validatePort("1")).toBe(true);
	});

	it("should return an error message for invalid port numbers", () => {
		expect(validatePort("0")).toBe(
			"Please enter a valid port number (1-65535).",
		);
		expect(validatePort("65536")).toBe(
			"Please enter a valid port number (1-65535).",
		);
		expect(validatePort("-1")).toBe(
			"Please enter a valid port number (1-65535).",
		);
		expect(validatePort("not-a-number")).toBe(
			"Please enter a valid port number (1-65535).",
		);
		expect(validatePort(" ")).toBe(
			"Please enter a valid port number (1-65535).",
		);
	});
});

describe("generateJwtSecret", () => {
	it("should generate a 64-byte hex string", () => {
		const secret = generateJwtSecret();
		expect(secret).toMatch(/^[a-f0-9]{128}$/);
	});

	it("should generate unique secrets", () => {
		const secret1 = generateJwtSecret();
		const secret2 = generateJwtSecret();
		expect(secret1).not.toBe(secret2);
	});

	it("should log a warning and throw an error if randomBytes fails", () => {
		const randomBytesSpy = vi
			.spyOn(crypto, "randomBytes")
			.mockImplementation(() => {
				throw new Error("Permission denied");
			});
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => generateJwtSecret()).toThrow("Failed to generate JWT secret");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"⚠️ Warning: Permission denied while generating JWT secret. Ensure the process has sufficient filesystem access.",
			expect.any(Error),
		);

		randomBytesSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});

describe("Error handling without backup", () => {
	it("should handle prompt errors when backup doesn't exist", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await apiSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(".backup");
		expect(fsCopyFileSyncSpy).not.toHaveBeenCalled();
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});

	it("should handle SIGINT when backup doesn't exist", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Mock file system to indicate no .env file exists (so no backup will be created)
		vi.spyOn(fs, "existsSync").mockReturnValue(false);

		// Mock all prompts to prevent setup from hanging
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			CI: "false",
			useDefaultMinio: true,
			useDefaultCloudbeaver: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			useDefaultApi: true,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
		});

		// Start setup() which will register the SIGINT handler
		// Don't await it - we'll interrupt it
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
		process.emit("SIGINT");

		// Wait for async handler to complete by polling for process.exit call
		// The handler calls process.exit, so we wait for that to be called
		const exitCallStartTime = Date.now();
		while (
			!processExitSpy.mock.calls.length &&
			Date.now() - exitCallStartTime < maxWaitTime
		) {
			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}

		// Check that the new SIGINT handler messages are present
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\n⚠️  Setup interrupted by user (CTRL+C)",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"📋 No backup was created yet, nothing to restore",
		);
		// When no backup exists, it should exit with 0 (success, nothing to restore)
		expect(processExitSpy).toHaveBeenCalledWith(0);

		// Clean up: restore mocks and handle the setup promise rejection
		processExitSpy.mockRestore();
		consoleLogSpy.mockRestore();
		vi.clearAllMocks();

		// The setup promise will reject because process.exit was called
		// Catch the rejection to prevent unhandled promise rejection warnings
		setupPromise.catch(() => {
			// Expected - setup was interrupted
		});
	});
});
