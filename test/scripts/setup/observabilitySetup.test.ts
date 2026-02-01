import inquirer from "inquirer";
import { observabilitySetup } from "scripts/setup/services/observabilitySetup";
import type { SetupAnswers } from "scripts/setup/types";
import { describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("observabilitySetup", () => {
	it("should prompt for sampling ratio when observability is enabled", async () => {
		// @ts-expect-error - Mocking inquirer prompt with simplified implementation
		vi.spyOn(inquirer, "prompt").mockImplementation(async (args: unknown) => {
			const question = (Array.isArray(args) ? args[0] : args) as {
				name: string;
				default?: unknown;
				type?: string;
				choices?: unknown[];
			};

			if (question.name === "API_OTEL_ENABLED")
				return { API_OTEL_ENABLED: "true" };
			if (question.name === "API_OTEL_SAMPLING_RATIO")
				return { API_OTEL_SAMPLING_RATIO: "0.5" };
			// Metrics prompts
			if (question.name === "API_METRICS_ENABLED")
				return { API_METRICS_ENABLED: "false" };

			const returnVal =
				question.default !== undefined
					? question.default
					: question.type === "list" && Array.isArray(question.choices)
						? question.choices[0]
						: "mocked-value";
			return { [question.name]: returnVal };
		});

		const answers: Partial<SetupAnswers> = {};
		await observabilitySetup(answers as SetupAnswers);
		expect(answers.API_OTEL_ENABLED).toBe("true");
		expect(answers.API_OTEL_SAMPLING_RATIO).toBe("0.5");
	});

	it("should not prompt for sampling ratio when observability is disabled", async () => {
		// @ts-expect-error - Mocking inquirer prompt with simplified implementation
		vi.spyOn(inquirer, "prompt").mockImplementation(async (args: unknown) => {
			const question = (Array.isArray(args) ? args[0] : args) as {
				name: string;
				default?: unknown;
				type?: string;
				choices?: unknown[];
			};

			if (question.name === "API_OTEL_ENABLED")
				return { API_OTEL_ENABLED: "false" };
			if (question.name === "API_OTEL_SAMPLING_RATIO")
				throw new Error("Should not prompt for sampling ratio");
			if (question.name === "API_METRICS_ENABLED")
				return { API_METRICS_ENABLED: "false" };

			const returnVal =
				question.default !== undefined
					? question.default
					: question.type === "list" && Array.isArray(question.choices)
						? question.choices[0]
						: "mocked-value";
			return { [question.name]: returnVal };
		});

		const answers: Partial<SetupAnswers> = {};
		await observabilitySetup(answers as SetupAnswers);
		expect(answers.API_OTEL_ENABLED).toBe("false");
		expect(answers.API_OTEL_SAMPLING_RATIO).toBeUndefined();
	});
});
