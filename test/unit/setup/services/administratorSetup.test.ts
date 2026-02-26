// Note: vi.mock calls are hoisted by vitest and execute before imports,
// so the order here (vi.mock before vi import) is intentional and works correctly
vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

describe("Setup -> administratorSetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should prompt for administrator email and store it in answers", async () => {
		const { administratorEmail } = await import(
			"scripts/setup/services/administratorSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptInput.mockResolvedValue("admin@example.com");

		await administratorEmail(answers);

		expect(answers.API_ADMINISTRATOR_USER_EMAIL_ADDRESS).toBe(
			"admin@example.com",
		);
		expect(mockPromptInput).toHaveBeenCalledTimes(1);
		expect(mockPromptInput).toHaveBeenCalledWith(
			"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
			"Enter administrator user email address:",
			"administrator@email.com",
			expect.any(Function), // validator function
		);
	});

	it("should handle prompt errors", async () => {
		const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});
		const { administratorEmail } = await import(
			"scripts/setup/services/administratorSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptInput.mockRejectedValue(new Error("User cancelled"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(administratorEmail(answers)).rejects.toThrow();

		consoleErrorSpy.mockRestore();
		exitSpy.mockRestore();
	});
});
