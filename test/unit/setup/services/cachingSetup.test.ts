vi.mock("inquirer");

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptHelpers
const mockPromptList = vi.fn();
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptList: (...args: unknown[]) => mockPromptList(...args),
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

// Mock validators
const mockValidatePositiveInteger = vi.fn();
vi.mock("scripts/setup/validators", () => ({
	validatePositiveInteger: (...args: unknown[]) =>
		mockValidatePositiveInteger(...args),
}));

// Mock sharedSetup's handlePromptError
const mockHandlePromptError = vi.fn(async (err: unknown) => {
	throw err;
});
vi.mock("scripts/setup/services/sharedSetup", () => ({
	handlePromptError: (err: unknown) => mockHandlePromptError(err),
}));

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";

describe("Setup -> cachingSetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should configure caching with warming disabled", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		// Mock user input: disable cache warming
		mockPromptList.mockResolvedValue("false");

		const result = await cachingSetup(answers);

		// Verify promptList was called for enableWarming
		expect(mockPromptList).toHaveBeenCalledWith(
			"enableWarming",
			"Enable cache warming at startup?",
			["true", "false"],
			"false",
		);

		// Verify CACHE_WARMING_ORG_COUNT is set to "0" when warming is disabled
		expect(result.CACHE_WARMING_ORG_COUNT).toBe("0");

		// Verify promptInput was NOT called (since warming is disabled)
		expect(mockPromptInput).not.toHaveBeenCalled();
	});

	it("should configure caching with warming enabled and prompt for count", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		// Mock user input: enable cache warming
		mockPromptList.mockResolvedValue("true");
		mockPromptInput.mockResolvedValue("20");

		const result = await cachingSetup(answers);

		// Verify enableWarming prompt
		expect(mockPromptList).toHaveBeenCalledWith(
			"enableWarming",
			"Enable cache warming at startup?",
			["true", "false"],
			"false",
		);

		// Verify CACHE_WARMING_ORG_COUNT prompt with validator
		expect(mockPromptInput).toHaveBeenCalledWith(
			"CACHE_WARMING_ORG_COUNT",
			"Number of top organizations to warm (by member count):",
			"10",
			expect.any(Function),
		);

		// Verify result
		expect(result.CACHE_WARMING_ORG_COUNT).toBe("20");
	});

	it("should pass validatePositiveInteger validator to promptInput", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("true");
		mockPromptInput.mockResolvedValue("15");

		await cachingSetup(answers);

		// Verify the validator was passed as the last argument to promptInput
		expect(mockPromptInput).toHaveBeenCalled();
		const call = mockPromptInput.mock.calls[0]!;
		expect(typeof call[3]).toBe("function");
		const validator = call[3] as (value: string) => unknown;
		validator("15");
		expect(mockValidatePositiveInteger).toHaveBeenCalledWith("15");
	});

	it("should not prompt for count when warming is disabled (conditional logic)", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("false");

		await cachingSetup(answers);

		// Verify promptInput was never called
		expect(mockPromptInput).not.toHaveBeenCalled();

		// Verify CACHE_WARMING_ORG_COUNT is set to "0" directly
		expect(answers.CACHE_WARMING_ORG_COUNT).toBe("0");
	});

	it("should accept different valid counts when warming is enabled", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);

		mockPromptList.mockResolvedValue("true");
		mockPromptInput.mockResolvedValue("50");

		const answers: SetupAnswers = {};
		const result = await cachingSetup(answers);

		expect(result.CACHE_WARMING_ORG_COUNT).toBe("50");
	});

	it("should handle prompt errors gracefully", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		const err = new Error("Prompt failed");
		mockPromptList.mockRejectedValue(err);

		await expect(cachingSetup(answers)).rejects.toThrow();

		expect(mockHandlePromptError).toHaveBeenCalledWith(err);
	});

	it("should handle errors when retrieving count input", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("true");
		const err = new Error("Input failed");
		mockPromptInput.mockRejectedValue(err);

		await expect(cachingSetup(answers)).rejects.toThrow();

		expect(mockHandlePromptError).toHaveBeenCalledWith(err);
	});

	it("should return updated answers object", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = { CI: "true" };

		mockPromptList.mockResolvedValue("false");

		const result = await cachingSetup(answers);

		// Verify it returns the same answers object with new properties
		expect(result).toHaveProperty("CI", "true");
		expect(result).toHaveProperty("CACHE_WARMING_ORG_COUNT", "0");
	});

	it("should use default value '10' when prompting for count", async () => {
		const { cachingSetup } = await import(
			"scripts/setup/services/cachingSetup"
		);
		const answers: SetupAnswers = {};

		mockPromptList.mockResolvedValue("true");
		mockPromptInput.mockResolvedValue("10");

		await cachingSetup(answers);

		// Verify the default value is passed to promptInput
		const call = mockPromptInput.mock.calls[0]!;
		expect(call[2]).toBe("10");
	});
});
