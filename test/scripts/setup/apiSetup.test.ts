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
import { validateSecurePassword } from "scripts/setup/validators";
import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

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
		process.env.MINIO_ROOT_PASSWORD = "password";
		process.env.POSTGRES_PASSWORD = "password";
		const isEnvConfigured = await checkEnvFile();
		const mockResponses = [
			...(isEnvConfigured ? [{ envReconfigure: true }] : []),
			{ CI: "true" },
			{ useDefaultApi: false },
			{ useDefaultMinio: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
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
			{ API_MINIO_TEST_END_POINT: "mocked-test-endpoint" },
			{ API_MINIO_USE_SSL: "false" },
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
			.mockResolvedValueOnce({ API_LOG_LEVEL: "info" })
			.mockResolvedValueOnce({ API_MINIO_ACCESS_KEY: "mocked-access-key" })
			.mockResolvedValueOnce({ API_MINIO_END_POINT: "mocked-endpoint" })
			.mockResolvedValueOnce({ API_MINIO_PORT: "9001" })
			.mockResolvedValueOnce({
				API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			})
			.mockResolvedValueOnce({ API_MINIO_USE_SSL: "true" });

		const answers: SetupAnswers = {};
		await apiSetup(answers);

		// Verify the number of prompts: 14 prompts
		// API_MINIO_SECRET_KEY is set in minioSetup()
		// All API_POSTGRES_* are now set in postgresSetup()
		expect(promptMock).toHaveBeenCalledTimes(14);
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

		// Mock prompts sequentially to match the order setup() calls them
		// Order: CI -> useDefaultMinio -> useDefaultCloudbeaver (if CI=false) -> useDefaultPostgres -> useDefaultCaddy -> useDefaultApi -> API_ADMINISTRATOR_USER_EMAIL_ADDRESS
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ CI: "false" }) // From setCI()
			.mockResolvedValueOnce({ useDefaultMinio: true }) // Line 913
			.mockResolvedValueOnce({ useDefaultCloudbeaver: true }) // Line 922 (only if CI === "false")
			.mockResolvedValueOnce({ useDefaultPostgres: true }) // Line 931
			.mockResolvedValueOnce({ useDefaultCaddy: true }) // Line 939
			.mockResolvedValueOnce({ useDefaultApi: true }) // Line 947
			.mockResolvedValueOnce({
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
			}); // From administratorEmail()

		// Start setup() which will register the SIGINT handler
		// Don't await it - we'll interrupt it
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
		// The handler calls process.exit, so we wait for that to be called
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
