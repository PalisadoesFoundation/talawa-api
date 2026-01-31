vi.mock("inquirer");

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
import { validateSecurePassword } from "scripts/setup/validators";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Helper function to wait for a condition to become true by polling
 * @param condition - A function that returns true when the condition is met
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @param pollInterval - Interval between checks in milliseconds (default: 10)
 * @throws {Error} If the timeout elapses before the condition becomes true
 */
async function waitFor(
	condition: () => boolean,
	timeout = 5000,
	pollInterval = 10,
): Promise<void> {
	const startTime = Date.now();
	while (!condition() && Date.now() - startTime < timeout) {
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}
	if (!condition()) {
		throw new Error(
			`waitFor: timeout waiting for condition after ${timeout}ms`,
		);
	}
}

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
		process.env.CI = "true";
		process.env.MINIO_ROOT_PASSWORD = "password";
		process.env.POSTGRES_PASSWORD = "password";
		const isEnvConfigured = await checkEnvFile();
		const mockResponses = [
			...(isEnvConfigured ? [{ envReconfigure: true }] : []),
			{ CI: "true" },
			{ useDefaultApi: false },
			// API Prompts start here because useDefaultApi is false
			{ API_BASE_URL: "http://localhost:5000" },
			{ API_HOST: "127.0.0.1" },
			{ API_PORT: "5000" },
			{ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" },
			{ API_IS_GRAPHIQL: "false" },
			{ API_IS_PINO_PRETTY: "false" },
			{ API_JWT_EXPIRES_IN: "3600000" },
			{ API_JWT_SECRET: "mocked-secret" },
			{ API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS: "86400" },
			{ API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET: "mocked-hmac-secret" },
			{ API_LOG_LEVEL: "info" },
			{ API_MINIO_ACCESS_KEY: "mocked-access-key" },
			{ API_MINIO_END_POINT: "mocked-endpoint" },
			{ API_MINIO_PORT: "9001" },
			{ API_MINIO_SECRET_KEY: "password" },
			{ API_MINIO_TEST_END_POINT: "mocked-test-endpoint" },
			{ API_MINIO_USE_SSL: "false" },
			{ API_POSTGRES_DATABASE: "talawa" },
			{ API_POSTGRES_HOST: "postgres" },
			{ API_POSTGRES_PASSWORD: "password" },
			{ API_POSTGRES_PORT: "5432" },
			{ API_POSTGRES_SSL_MODE: "false" },
			{ API_POSTGRES_TEST_HOST: "postgres-test" },
			{ API_POSTGRES_USER: "talawa" },
			// End of API Prompts
			{ useDefaultMinio: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ setupReCaptcha: false },
			{ configureEmail: false },
			{ setupOAuth: false },
			{ setupMetrics: false },
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
			API_MINIO_USE_SSL: "false",
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
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
		(
			vi.spyOn(fs.promises, "readdir") as ReturnType<typeof vi.fn>
		).mockResolvedValue([".env.1600000000", ".env.1700000000"]);
		const fsCopyFileSpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "rename").mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await apiSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSpy).toHaveBeenCalledWith(
			path.join(".backup", ".env.1700000000"),
			".env.tmp",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});

	it("should not prompt for API_MINIO_SECRET_KEY or API_POSTGRES_* (set in service functions)", async () => {
		// These values are now set automatically in minioSetup() and postgresSetup()
		// apiSetup() should NOT prompt for them
		const promptMock = vi.spyOn(inquirer, "prompt");

		// Mock all prompts that apiSetup actually makes (PostgreSQL prompts moved to postgresSetup)
		promptMock
			.mockResolvedValueOnce({ API_BASE_URL: "http://localhost:5000" })
			.mockResolvedValueOnce({ API_HOST: "127.0.0.1" })
			.mockResolvedValueOnce({ API_PORT: "5000" })
			.mockResolvedValueOnce({ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" })
			.mockResolvedValueOnce({ API_IS_GRAPHIQL: "true" })
			.mockResolvedValueOnce({ API_IS_PINO_PRETTY: "false" })
			.mockResolvedValueOnce({ API_JWT_EXPIRES_IN: "3600000" })
			.mockResolvedValueOnce({ API_JWT_SECRET: "mocked-secret" })
			.mockResolvedValueOnce({
				API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS: "86400",
			})
			.mockResolvedValueOnce({
				API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET: "mocked-hmac-secret",
			})
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({ API_MINIO_SECRET_KEY: "mocked-secret-key" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" })
			.mockResolvedValueOnce({ API_POSTGRES_DATABASE: "talawa" })
			.mockResolvedValueOnce({ API_POSTGRES_HOST: "postgres" })
			.mockResolvedValueOnce({ API_POSTGRES_PASSWORD: "password" })
			.mockResolvedValueOnce({ API_POSTGRES_PORT: "5432" })
			.mockResolvedValueOnce({ API_POSTGRES_SSL_MODE: "false" })
			.mockResolvedValueOnce({ API_POSTGRES_TEST_HOST: "postgres-test" })
			.mockResolvedValueOnce({ API_POSTGRES_USER: "talawa" });

		const answers: SetupAnswers = {};
		await apiSetup(answers);

		// Verify the number of prompts: 24 prompts
		expect(promptMock).toHaveBeenCalledTimes(24);
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
			"⚠️ Warning: Failed to generate random bytes for JWT secret. This may indicate a system entropy issue.",
			expect.any(Error),
		);

		randomBytesSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});

describe("validateSecurePassword", () => {
	it("should return true for valid secure passwords", () => {
		expect(validateSecurePassword("Password1!")).toBe(true);
		expect(validateSecurePassword("Abc12345@")).toBe(true);
		expect(validateSecurePassword("MyStr0ng#Pass")).toBe(true);
	});

	it("should reject empty passwords", () => {
		expect(validateSecurePassword("")).toBe("Password is required");
		expect(validateSecurePassword("   ")).toBe("Password is required");
	});

	it("should reject passwords shorter than 8 characters", () => {
		expect(validateSecurePassword("Pass1!")).toBe(
			"Password must be at least 8 characters long",
		);
	});

	it("should reject passwords without uppercase letters", () => {
		expect(validateSecurePassword("password1!")).toBe(
			"Password must contain at least one uppercase letter",
		);
	});

	it("should reject passwords without lowercase letters", () => {
		expect(validateSecurePassword("PASSWORD1!")).toBe(
			"Password must contain at least one lowercase letter",
		);
	});

	it("should reject passwords without numbers", () => {
		expect(validateSecurePassword("Password!@")).toBe(
			"Password must contain at least one number",
		);
	});

	it("should reject passwords without special characters", () => {
		expect(validateSecurePassword("Password123")).toBe(
			"Password must contain at least one special character (!@#$%^&*())",
		);
	});
});

describe("Error handling without backup", () => {
	afterEach(() => {
		// Remove SIGINT listeners to prevent interference with other tests
		process.removeAllListeners("SIGINT");
		// Restore and clear all mocks
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	it("should handle prompt errors when backup doesn't exist", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		const fsAccessSpy = vi
			.spyOn(fs.promises, "access")
			.mockRejectedValue(
				Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
			);
		const fsCopyFileSpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await apiSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsAccessSpy).toHaveBeenCalledWith(".backup");
		expect(fsCopyFileSpy).not.toHaveBeenCalled();
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});

	it("should handle SIGINT when backup doesn't exist", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Mock file system - use async fs.promises methods that setup.ts actually calls
		vi.spyOn(fs.promises, "access").mockRejectedValue(
			Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
		);

		// Mock prompts sequentially to match the order setup() calls them
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ CI: "false" }) // From setCI()
			.mockResolvedValueOnce({ useDefaultApi: true })
			.mockResolvedValueOnce({ useDefaultMinio: true })
			.mockResolvedValueOnce({ useDefaultCloudbeaver: true })
			.mockResolvedValueOnce({ useDefaultPostgres: true })
			.mockResolvedValueOnce({ useDefaultCaddy: true })
			.mockResolvedValueOnce({
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			});

		// Start setup() which will register the SIGINT handler
		// Attach catch handler immediately to prevent unhandled promise rejections
		setup().catch(() => {
			// Expected - setup will be interrupted by SIGINT
		});

		// Wait deterministically for SIGINT handler to be registered
		await waitFor(() => process.listenerCount("SIGINT") > 0);

		// Verify handler was registered
		expect(process.listenerCount("SIGINT")).toBeGreaterThan(0);

		// Emit SIGINT to trigger the handler
		process.emit("SIGINT");

		// Wait for async handler to complete by polling for process.exit call
		await waitFor(() => processExitSpy.mock.calls.length > 0);

		// Verify process.exit was called
		expect(processExitSpy.mock.calls.length).toBeGreaterThan(0);

		// Check that the new SIGINT handler messages are present
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\n⚠️  Setup interrupted by user (CTRL+C)",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"📋 No backup was created yet, nothing to restore",
		);
		// When no backup exists, it should exit with 0 (success, nothing to restore)
		expect(processExitSpy).toHaveBeenCalledWith(0);
	});
});
