vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptList
const mockPromptList = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptList: (...args: unknown[]) => mockPromptList(...args),
}));

describe("Setup -> ciSetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should prompt for CI setting with default 'false'", async () => {
		const { setCI } = await import("scripts/setup/services/ciSetup");
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("false");

		await setCI(answers);

		expect(answers.CI).toBe("false");
		expect(mockPromptList).toHaveBeenCalledWith(
			"CI",
			"Set CI:",
			["true", "false"],
			"false",
		);
	});

	it("should accept 'true' value for CI", async () => {
		const { setCI } = await import("scripts/setup/services/ciSetup");
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("true");

		await setCI(answers);

		expect(answers.CI).toBe("true");
	});

	it("should handle prompt errors", async () => {
		const { setCI } = await import("scripts/setup/services/ciSetup");
		const answers: SetupAnswers = {};

		mockPromptList.mockRejectedValue(new Error("User cancelled"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(setCI(answers)).rejects.toThrow();

		consoleErrorSpy.mockRestore();
	});
});
