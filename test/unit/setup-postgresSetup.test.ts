vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

describe("Setup -> postgresSetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.POSTGRES_PASSWORD;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Basic Setup", () => {
		it("should configure Postgres with CI=true (no port prompts)", async () => {
			const { postgresSetup } = await import(
				"scripts/setup/services/postgresSetup"
			);
			const answers: SetupAnswers = { CI: "true" };

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("talawa") // POSTGRES_DB
				.mockResolvedValueOnce("password") // POSTGRES_PASSWORD
				.mockResolvedValueOnce("talawa"); // POSTGRES_USER

			await postgresSetup(answers);

			expect(answers.POSTGRES_DB).toBe("talawa");
			expect(answers.POSTGRES_PASSWORD).toBe("password");
			expect(answers.POSTGRES_USER).toBe("talawa");
			expect(answers.POSTGRES_MAPPED_HOST_IP).toBeUndefined();
			expect(answers.POSTGRES_MAPPED_PORT).toBeUndefined();

			consoleLogSpy.mockRestore();
		});

		it("should configure Postgres with CI=false (with port prompts)", async () => {
			const { postgresSetup } = await import(
				"scripts/setup/services/postgresSetup"
			);
			const answers: SetupAnswers = { CI: "false" };

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("talawa") // POSTGRES_DB
				.mockResolvedValueOnce("127.0.0.1") // POSTGRES_MAPPED_HOST_IP
				.mockResolvedValueOnce("5432") // POSTGRES_MAPPED_PORT
				.mockResolvedValueOnce("password") // POSTGRES_PASSWORD
				.mockResolvedValueOnce("talawa"); // POSTGRES_USER

			await postgresSetup(answers);

			expect(answers.POSTGRES_DB).toBe("talawa");
			expect(answers.POSTGRES_MAPPED_HOST_IP).toBe("127.0.0.1");
			expect(answers.POSTGRES_MAPPED_PORT).toBe("5432");
			expect(answers.POSTGRES_PASSWORD).toBe("password");
			expect(answers.POSTGRES_USER).toBe("talawa");

			consoleLogSpy.mockRestore();
		});
	});

	describe("Password Synchronization", () => {
		it("should sync API_POSTGRES_PASSWORD when POSTGRES_PASSWORD is changed", async () => {
			const { postgresSetup } = await import(
				"scripts/setup/services/postgresSetup"
			);
			const answers: SetupAnswers = {
				CI: "true",
				API_POSTGRES_PASSWORD: "old_password",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("talawa") // POSTGRES_DB
				.mockResolvedValueOnce("new_password") // POSTGRES_PASSWORD (changed)
				.mockResolvedValueOnce("talawa"); // POSTGRES_USER

			await postgresSetup(answers);

			expect(answers.POSTGRES_PASSWORD).toBe("new_password");
			expect(answers.API_POSTGRES_PASSWORD).toBe("new_password");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"API_POSTGRES_PASSWORD updated to match POSTGRES_PASSWORD",
				),
			);

			consoleLogSpy.mockRestore();
		});

		it("should use existing API_POSTGRES_PASSWORD as default", async () => {
			const { postgresSetup } = await import(
				"scripts/setup/services/postgresSetup"
			);
			const answers: SetupAnswers = {
				CI: "true",
				API_POSTGRES_PASSWORD: "existing_password",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("talawa") // POSTGRES_DB
				.mockResolvedValueOnce("existing_password") // POSTGRES_PASSWORD (same)
				.mockResolvedValueOnce("talawa"); // POSTGRES_USER

			await postgresSetup(answers);

			expect(answers.POSTGRES_PASSWORD).toBe("existing_password");
			expect(answers.API_POSTGRES_PASSWORD).toBe("existing_password");
			// Should not log the update message since they match
			expect(consoleLogSpy).not.toHaveBeenCalledWith(
				expect.stringContaining("API_POSTGRES_PASSWORD updated"),
			);

			consoleLogSpy.mockRestore();
		});

		it("should set API_POSTGRES_PASSWORD when it was not set before", async () => {
			const { postgresSetup } = await import(
				"scripts/setup/services/postgresSetup"
			);
			const answers: SetupAnswers = { CI: "true" };

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("talawa") // POSTGRES_DB
				.mockResolvedValueOnce("new_password") // POSTGRES_PASSWORD
				.mockResolvedValueOnce("talawa"); // POSTGRES_USER

			await postgresSetup(answers);

			expect(answers.POSTGRES_PASSWORD).toBe("new_password");
			expect(answers.API_POSTGRES_PASSWORD).toBe("new_password");
			expect(process.env.POSTGRES_PASSWORD).toBe("new_password");

			consoleLogSpy.mockRestore();
		});
	});
	describe("Error Handling", () => {
		it("should handle prompt errors gracefully", async () => {
			const { postgresSetup } = await import(
				"scripts/setup/services/postgresSetup"
			);
			const answers: SetupAnswers = { CI: "true" };

			// Mock first prompt to fail
			mockPromptInput.mockRejectedValueOnce(new Error("Prompt failed"));

			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(postgresSetup(answers)).rejects.toThrow();

			expect(consoleErrorSpy).toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
		});
	});
});
