vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

describe("Setup -> cloudbeaverSetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.CLOUDBEAVER_ADMIN_PASSWORD;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should configure all CloudBeaver settings", async () => {
		const { cloudbeaverSetup } = await import(
			"scripts/setup/services/cloudbeaverSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptInput
			.mockResolvedValueOnce("talawa") // CLOUDBEAVER_ADMIN_NAME
			.mockResolvedValueOnce("admin_password") // CLOUDBEAVER_ADMIN_PASSWORD
			.mockResolvedValueOnce("127.0.0.1") // CLOUDBEAVER_MAPPED_HOST_IP
			.mockResolvedValueOnce("8978") // CLOUDBEAVER_MAPPED_PORT
			.mockResolvedValueOnce("Talawa CloudBeaver Server") // CLOUDBEAVER_SERVER_NAME
			.mockResolvedValueOnce("http://127.0.0.1:8978"); // CLOUDBEAVER_SERVER_URL

		await cloudbeaverSetup(answers);

		expect(answers.CLOUDBEAVER_ADMIN_NAME).toBe("talawa");
		expect(answers.CLOUDBEAVER_ADMIN_PASSWORD).toBe("admin_password");
		expect(answers.CLOUDBEAVER_MAPPED_HOST_IP).toBe("127.0.0.1");
		expect(answers.CLOUDBEAVER_MAPPED_PORT).toBe("8978");
		expect(answers.CLOUDBEAVER_SERVER_NAME).toBe("Talawa CloudBeaver Server");
		expect(answers.CLOUDBEAVER_SERVER_URL).toBe("http://127.0.0.1:8978");
	});

	it("should use existing environment password as default", async () => {
		const { cloudbeaverSetup } = await import(
			"scripts/setup/services/cloudbeaverSetup"
		);
		const answers: SetupAnswers = {};

		process.env.CLOUDBEAVER_ADMIN_PASSWORD = "env_password";

		mockPromptInput
			.mockResolvedValueOnce("talawa") // CLOUDBEAVER_ADMIN_NAME
			.mockResolvedValueOnce("env_password") // CLOUDBEAVER_ADMIN_PASSWORD
			.mockResolvedValueOnce("127.0.0.1") // CLOUDBEAVER_MAPPED_HOST_IP
			.mockResolvedValueOnce("8978") // CLOUDBEAVER_MAPPED_PORT
			.mockResolvedValueOnce("Talawa CloudBeaver Server") // CLOUDBEAVER_SERVER_NAME
			.mockResolvedValueOnce("http://127.0.0.1:8978"); // CLOUDBEAVER_SERVER_URL

		await cloudbeaverSetup(answers);

		expect(answers.CLOUDBEAVER_ADMIN_PASSWORD).toBe("env_password");
		// Verify env password was passed as default (2nd call = password prompt)
		expect(mockPromptInput).toHaveBeenNthCalledWith(
			2,
			"CLOUDBEAVER_ADMIN_PASSWORD",
			expect.any(String),
			"env_password",
			expect.any(Function),
		);
	});

	it("should handle prompt errors", async () => {
		const { cloudbeaverSetup } = await import(
			"scripts/setup/services/cloudbeaverSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptInput.mockRejectedValue(new Error("User cancelled"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(cloudbeaverSetup(answers)).rejects.toThrow();

		consoleErrorSpy.mockRestore();
	});
});
