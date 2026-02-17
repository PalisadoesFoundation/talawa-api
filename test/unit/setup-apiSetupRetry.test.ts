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

			// Mock user providing correct password on first try
			mockPromptInput.mockResolvedValue("correct_password");

			await apiSetup(answers);

			expect(answers.API_MINIO_SECRET_KEY).toBe("correct_password");
		});

		it("should throw error after 3 failed MinIO password attempts", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.MINIO_ROOT_PASSWORD = "correct_password";

			// Mock user providing wrong password 3 times
			mockPromptInput
				.mockResolvedValueOnce("wrong1")
				.mockResolvedValueOnce("wrong2")
				.mockResolvedValueOnce("wrong3");

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			// Mock console.error to suppress error output
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			// The error will be caught by handlePromptError which calls process.exit
			// Vitest intercepts process.exit and throws, so we just verify it throws
			await expect(apiSetup(answers)).rejects.toThrow();

			// The loop runs: first wrong attempt (warn), second wrong attempt (warn), third attempt throws
			// So we get 2 warnings, not 3
			expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		it("should cancel setup when user types 'exit' for MinIO password", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = {};

			// Set existing password
			process.env.MINIO_ROOT_PASSWORD = "correct_password";

			// Mock user typing wrong password then 'exit'
			mockPromptInput
				.mockResolvedValueOnce("wrong_password")
				.mockResolvedValueOnce("exit");

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

			// Mock user typing wrong password then 'EXIT' (uppercase)
			mockPromptInput
				.mockResolvedValueOnce("wrong_password")
				.mockResolvedValueOnce("EXIT");

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
			let callCount = 0;
			mockPromptInput.mockImplementation(() => {
				callCount++;
				// Return correct password for Postgres prompts
				if (callCount >= 5) {
					// After MinIO prompts
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
			let callCount = 0;
			mockPromptInput.mockImplementation(() => {
				callCount++;
				// For Postgres password prompts (after MinIO setup)
				if (callCount >= 5) {
					// Return wrong passwords
					if (callCount === 5) return Promise.resolve("wrong1");
					if (callCount === 6) return Promise.resolve("wrong2");
					if (callCount === 7) return Promise.resolve("wrong3");
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
			let callCount = 0;
			mockPromptInput.mockImplementation(() => {
				callCount++;
				if (callCount >= 5) {
					if (callCount === 5) return Promise.resolve("wrong");
					if (callCount === 6) return Promise.resolve("exit");
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
