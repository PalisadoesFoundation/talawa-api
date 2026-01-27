import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import inquirer from "inquirer";
import { setCI } from "scripts/setup/services/ciSetup";

describe("Setup -> setCI", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should set CI=true when user selects true", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ CI: "true" });
		const answers = await setCI({});
		expect(answers.CI).toBe("true");
	});

	it("should set CI=false when user selects false", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ CI: "false" });
		const answers = await setCI({});
		expect(answers.CI).toBe("false");
	});

	it("should use default value of 'false'", async () => {
		// Verify that the prompt is called with default "false"
		const promptSpy = vi
			.spyOn(inquirer, "prompt")
			.mockResolvedValue({ CI: "false" });
		await setCI({});

		// Inquirer prompt structure: [{ name: "CI", default: "false", ... }]
		const firstCall = promptSpy.mock.calls[0];
		if (!firstCall) throw new Error("Prompt was not called");

		const callArgs = firstCall[0];
		// @ts-expect-error
		// biome-ignore lint/suspicious/noExplicitAny: Mocking inquirer
		const ciPrompt = callArgs.find((q: any) => q.name === "CI");
		expect(ciPrompt).toBeDefined();
		expect(ciPrompt?.default).toBe("false");
	});
});
