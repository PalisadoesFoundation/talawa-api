vi.mock("inquirer");

import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import {
	apiSetup,
	checkEnvFile,
	generateJwtSecret,
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

	const isEnvConfigured = checkEnvFile();

	it("should prompt the user for API configuration and update environment variables", async () => {
		process.env.MINIO_ROOT_PASSWORD = "password";
		process.env.POSTGRES_PASSWORD = "password";
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
		const consoleWarnSpy = vi.spyOn(console, "warn");

		let answers: Record<string, string> = {};
		answers = await apiSetup(answers);

		// Verify user is prompted twice because first attempt was incorrect
		expect(promptMock).toHaveBeenCalledTimes(24);
		expect(answers.API_POSTGRES_PASSWORD).toBe("password");

		// Verify warning message was shown
		expect(consoleWarnSpy.mock.calls).toEqual([
			["⚠️ API_MINIO_SECRET_KEY must match MINIO_ROOT_PASSWORD."],
			["⚠️ API_POSTGRES_PASSWORD must match POSTGRES_PASSWORD."],
		]);
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
		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => undefined);

		const consoleLogSpy = vi.spyOn(console, "log");

		process.emit("SIGINT");

		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nProcess interrupted! Undoing changes...",
		);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(".backup");
		expect(fsCopyFileSyncSpy).not.toHaveBeenCalled();
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
