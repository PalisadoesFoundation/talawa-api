vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput to simulate user input
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
	promptList: vi.fn().mockResolvedValue("false"),
	promptConfirm: vi.fn().mockResolvedValue(true),
}));

describe("Setup -> apiSetup -> Password Retry Limits", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset environment variables
		delete process.env.MINIO_ROOT_PASSWORD;
		delete process.env.POSTGRES_PASSWORD;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("MinIO Password Retry", () => {
		it("should accept matching MinIO password on first attempt", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.MINIO_ROOT_PASSWORD = "correct_password";

			// Use name-based mocking to provide realistic responses for each prompt
			mockPromptInput.mockImplementation((name: string) => {
				if (name === "API_MINIO_SECRET_KEY")
					return Promise.resolve("correct_password");
				if (name === "API_BASE_URL")
					return Promise.resolve("http://localhost:4000");
				if (name === "API_HOST") return Promise.resolve("localhost");
				if (name === "API_PORT") return Promise.resolve("4000");
				if (name === "API_SMTP_PROVIDER") return Promise.resolve("gmail");
				if (name === "API_JWT_SECRET") return Promise.resolve("testsecret123");
				if (name === "API_JWT_REFRESH_SECRET")
					return Promise.resolve("refreshsecret123");
				if (name === "API_POSTGRES_PASSWORD")
					return Promise.resolve("postgres_pass");
				if (name === "API_POSTGRES_USER") return Promise.resolve("talawa");
				return Promise.resolve("");
			});

			await apiSetup(answers);

			expect(answers.API_MINIO_SECRET_KEY).toBe("correct_password");
			expect(answers.API_BASE_URL).toBe("http://localhost:4000");
			expect(answers.API_JWT_SECRET).toBeDefined();
		});

		it("should throw error after 3 failed MinIO password attempts", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.MINIO_ROOT_PASSWORD = "correct_password";

			// Use name-based mocking: return wrong passwords specifically for MinIO prompt
			let minioCallCount = 0;
			mockPromptInput.mockImplementation((name: string) => {
				if (name === "API_MINIO_SECRET_KEY") {
					minioCallCount++;
					if (minioCallCount === 1) return Promise.resolve("wrong1");
					if (minioCallCount === 2) return Promise.resolve("wrong2");
					if (minioCallCount === 3) return Promise.resolve("wrong3");
				}
				// Provide defaults for other prompts so they complete
				if (name === "API_BASE_URL")
					return Promise.resolve("http://localhost:4000");
				if (name === "API_PORT") return Promise.resolve("4000");
				if (name === "API_POSTGRES_PASSWORD") return Promise.resolve("pass");
				if (name === "API_POSTGRES_USER") return Promise.resolve("talawa");
				return Promise.resolve("");
			});

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(apiSetup(answers)).rejects.toThrow();

			// The loop runs: first wrong attempt (warn), second wrong attempt (warn), third attempt throws
			expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		it("should cancel setup when user types 'exit' for MinIO password", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.MINIO_ROOT_PASSWORD = "correct_password";

			// Use name-based mocking: wrong password then 'exit' specifically for MinIO prompt
			let minioCallCount = 0;
			mockPromptInput.mockImplementation((name: string) => {
				if (name === "API_MINIO_SECRET_KEY") {
					minioCallCount++;
					if (minioCallCount === 1) return Promise.resolve("wrong_password");
					return Promise.resolve("exit");
				}
				if (name === "API_BASE_URL")
					return Promise.resolve("http://localhost:4000");
				return Promise.resolve("");
			});

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(apiSetup(answers)).rejects.toThrow();

			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		it("should be case-insensitive for 'exit' sentinel in MinIO password", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.MINIO_ROOT_PASSWORD = "correct_password";

			// Use name-based mocking: wrong password then 'EXIT' specifically for MinIO prompt
			let minioCallCount = 0;
			mockPromptInput.mockImplementation((name: string) => {
				if (name === "API_MINIO_SECRET_KEY") {
					minioCallCount++;
					if (minioCallCount === 1) return Promise.resolve("wrong_password");
					return Promise.resolve("EXIT");
				}
				if (name === "API_BASE_URL")
					return Promise.resolve("http://localhost:4000");
				return Promise.resolve("");
			});

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(apiSetup(answers)).rejects.toThrow();

			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});
	});

	describe("Postgres Password Retry", () => {
		it("should accept matching Postgres password on first attempt", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.POSTGRES_PASSWORD = "pg_correct";

			// Mock user providing correct password on first try
			mockPromptInput.mockImplementation((name: string) => {
				if (name === "API_POSTGRES_PASSWORD") {
					return Promise.resolve("pg_correct");
				}
				return Promise.resolve("default_value");
			});

			await apiSetup(answers);

			expect(answers.API_POSTGRES_PASSWORD).toBe("pg_correct");
		});

		it("should throw error after 3 failed Postgres password attempts", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.POSTGRES_PASSWORD = "pg_correct";

			// Mock various inputs, with wrong Postgres passwords
			let postgresAttempt = 0;
			mockPromptInput.mockImplementation((name: string) => {
				// For Postgres password prompts
				if (name === "API_POSTGRES_PASSWORD") {
					postgresAttempt++;
					if (postgresAttempt === 1) return Promise.resolve("wrong1");
					if (postgresAttempt === 2) return Promise.resolve("wrong2");
					if (postgresAttempt === 3) return Promise.resolve("wrong3");
				}
				return Promise.resolve("default_value");
			});

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(apiSetup(answers)).rejects.toThrow();

			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		it("should cancel setup when user types 'exit' for Postgres password", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.POSTGRES_PASSWORD = "pg_correct";

			// Mock inputs with 'exit' for Postgres
			let postgresAttempt = 0;
			mockPromptInput.mockImplementation((name: string) => {
				if (name === "API_POSTGRES_PASSWORD") {
					postgresAttempt++;
					if (postgresAttempt === 1) return Promise.resolve("wrong");
					if (postgresAttempt === 2) return Promise.resolve("exit");
				}
				return Promise.resolve("default_value");
			});

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(apiSetup(answers)).rejects.toThrow();

			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});
	});

	describe("No Existing Password", () => {
		it("should set MinIO password when no existing password", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// No existing password
			delete process.env.MINIO_ROOT_PASSWORD;

			mockPromptInput.mockResolvedValue("new_password");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			expect(answers.API_MINIO_SECRET_KEY).toBe("new_password");
			expect(answers.MINIO_ROOT_PASSWORD).toBe("new_password");
			expect(process.env.MINIO_ROOT_PASSWORD).toBe("new_password");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
				),
			);

			consoleLogSpy.mockRestore();
		});

		it("should set Postgres password when no existing password", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// No existing password
			delete process.env.POSTGRES_PASSWORD;

			mockPromptInput.mockResolvedValue("new_pg_pass");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			expect(answers.API_POSTGRES_PASSWORD).toBe("new_pg_pass");
			expect(answers.POSTGRES_PASSWORD).toBe("new_pg_pass");
			expect(process.env.POSTGRES_PASSWORD).toBe("new_pg_pass");

			consoleLogSpy.mockRestore();
		});
	});
});
