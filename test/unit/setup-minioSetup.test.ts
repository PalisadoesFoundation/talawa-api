vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

describe("Setup -> minioSetup", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.MINIO_ROOT_PASSWORD;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Port Conflict Detection", () => {
		it("should detect port conflict and re-prompt for console port", async () => {
			const { minioSetup } = await import("scripts/setup/services/minioSetup");
			const answers: SetupAnswers = { CI: "false" };

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			// Mock responses: browser, api_ip, api_port, console_ip, console_port (same), console_port (different), root_password, root_user
			mockPromptInput
				.mockResolvedValueOnce("on") // MINIO_BROWSER
				.mockResolvedValueOnce("127.0.0.1") // MINIO_API_MAPPED_HOST_IP
				.mockResolvedValueOnce("9000") // MINIO_API_MAPPED_PORT
				.mockResolvedValueOnce("127.0.0.1") // MINIO_CONSOLE_MAPPED_HOST_IP
				.mockResolvedValueOnce("9000") // MINIO_CONSOLE_MAPPED_PORT (conflict!)
				.mockResolvedValueOnce("9001") // MINIO_CONSOLE_MAPPED_PORT (fixed)
				.mockResolvedValueOnce("password") // MINIO_ROOT_PASSWORD
				.mockResolvedValueOnce("talawa"); // MINIO_ROOT_USER

			await minioSetup(answers);

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("Port conflict detected"),
			);
			expect(answers.MINIO_API_MAPPED_PORT).toBe("9000");
			expect(answers.MINIO_CONSOLE_MAPPED_PORT).toBe("9001");

			consoleWarnSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});

		it("should not prompt for ports when CI is true", async () => {
			const { minioSetup } = await import("scripts/setup/services/minioSetup");
			const answers: SetupAnswers = { CI: "true" };

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("off") // MINIO_BROWSER
				.mockResolvedValueOnce("password") // MINIO_ROOT_PASSWORD
				.mockResolvedValueOnce("talawa"); // MINIO_ROOT_USER

			await minioSetup(answers);

			expect(answers.MINIO_API_MAPPED_PORT).toBeUndefined();
			expect(answers.MINIO_CONSOLE_MAPPED_PORT).toBeUndefined();
			expect(answers.MINIO_BROWSER).toBe("off");

			consoleLogSpy.mockRestore();
		});
	});

	describe("Password Synchronization", () => {
		it("should sync API_MINIO_SECRET_KEY when MINIO_ROOT_PASSWORD is changed", async () => {
			const { minioSetup } = await import("scripts/setup/services/minioSetup");
			const answers: SetupAnswers = {
				CI: "true",
				API_MINIO_SECRET_KEY: "old_password",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("off") // MINIO_BROWSER
				.mockResolvedValueOnce("new_password") // MINIO_ROOT_PASSWORD (changed)
				.mockResolvedValueOnce("talawa"); // MINIO_ROOT_USER

			await minioSetup(answers);

			expect(answers.MINIO_ROOT_PASSWORD).toBe("new_password");
			expect(answers.API_MINIO_SECRET_KEY).toBe("new_password");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"API_MINIO_SECRET_KEY updated to match MINIO_ROOT_PASSWORD",
				),
			);

			consoleLogSpy.mockRestore();
		});

		it("should use existing API_MINIO_SECRET_KEY as default", async () => {
			const { minioSetup } = await import("scripts/setup/services/minioSetup");
			const answers: SetupAnswers = {
				CI: "true",
				API_MINIO_SECRET_KEY: "existing_password",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockPromptInput
				.mockResolvedValueOnce("off") // MINIO_BROWSER
				.mockResolvedValueOnce("existing_password") // MINIO_ROOT_PASSWORD (same)
				.mockResolvedValueOnce("talawa"); // MINIO_ROOT_USER

			await minioSetup(answers);

			expect(answers.MINIO_ROOT_PASSWORD).toBe("existing_password");
			expect(answers.API_MINIO_SECRET_KEY).toBe("existing_password");
			// Should not log the update message since they match
			expect(consoleLogSpy).not.toHaveBeenCalledWith(
				expect.stringContaining("API_MINIO_SECRET_KEY updated"),
			);

			consoleLogSpy.mockRestore();
		});
	});
});
