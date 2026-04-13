vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPromptList = vi.fn();
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptList: (...args: unknown[]) => mockPromptList(...args),
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

const mockValidatePositiveInteger = vi.fn();
vi.mock("scripts/setup/validators", () => ({
	validatePositiveInteger: (...args: unknown[]) =>
		mockValidatePositiveInteger(...args),
}));

describe("Setup -> cachingSetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should configure caching with warming disabled and set count to '0'", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("false");

		const result = await cachingSetup(answers);

		expect(mockPromptList).toHaveBeenCalledWith(
			"enableWarming",
			"Enable cache warming at startup?",
			["true", "false"],
			"false",
		);
		expect(result.CACHE_WARMING_ORG_COUNT).toBe("0");
		expect(mockPromptInput).not.toHaveBeenCalled();
	});

	it("should configure caching with warming enabled and prompt for count", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("true");
		mockPromptInput.mockResolvedValue("20");

		const result = await cachingSetup(answers);

		expect(mockPromptList).toHaveBeenCalledWith(
			"enableWarming",
			"Enable cache warming at startup?",
			["true", "false"],
			"false",
		);
		expect(mockPromptInput).toHaveBeenCalledWith(
			"CACHE_WARMING_ORG_COUNT",
			"Number of top organizations to warm (by member count):",
			"10",
			expect.any(Function),
		);
		expect(result.CACHE_WARMING_ORG_COUNT).toBe("20");
	});

	it("should pass validatePositiveInteger as the validator for count input", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("true");
		mockPromptInput.mockResolvedValue("5");

		await cachingSetup(answers);

		const validatorArg = mockPromptInput.mock.calls[0]?.[3];
		expect(validatorArg).toBeDefined();
		validatorArg("10");
		expect(mockValidatePositiveInteger).toHaveBeenCalledWith("10");
	});

	it("should return the same answers object reference", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("false");

		const result = await cachingSetup(answers);

		expect(result).toBe(answers);
	});

	it("should handle prompt errors gracefully", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockRejectedValue(new Error("User cancelled"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(cachingSetup(answers)).rejects.toThrow();

		consoleErrorSpy.mockRestore();
	});
});
