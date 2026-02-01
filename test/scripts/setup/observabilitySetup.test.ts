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

	it("should configure all metrics settings when metrics are enabled", async () => {
		// @ts-expect-error - Mocking inquirer prompt with simplified implementation
		vi.spyOn(inquirer, "prompt").mockImplementation(async (args: unknown) => {
			const question = (Array.isArray(args) ? args[0] : args) as {
				name: string;
				default?: unknown;
				type?: string;
				choices?: unknown[];
			};

			// Map of responses for metrics enabled
			const responses: Record<string, string> = {
				API_OTEL_ENABLED: "false",
				API_METRICS_ENABLED: "true",
				API_METRICS_API_KEY: "test-api-key-123",
				API_METRICS_SLOW_REQUEST_MS: "1000",
				API_METRICS_SLOW_OPERATION_MS: "300",
				API_METRICS_AGGREGATION_ENABLED: "false",
				API_METRICS_SNAPSHOT_RETENTION_COUNT: "500",
			};

			return { [question.name]: responses[question.name] || "default-value" };
		});

		const answers: Partial<SetupAnswers> = {};
		await observabilitySetup(answers as SetupAnswers);

		expect(answers.API_METRICS_ENABLED).toBe("true");
		expect(answers.API_METRICS_API_KEY).toBe("test-api-key-123");
		expect(answers.API_METRICS_SLOW_REQUEST_MS).toBe("1000");
		expect(answers.API_METRICS_SLOW_OPERATION_MS).toBe("300");
		expect(answers.API_METRICS_AGGREGATION_ENABLED).toBe("false");
		expect(answers.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe("500");

		// Aggregation fields should not be set when aggregation is disabled
		expect(answers.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBeUndefined();
		expect(answers.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBeUndefined();
		expect(answers.API_METRICS_CACHE_TTL_SECONDS).toBeUndefined();
	});

	it("should configure aggregation settings when aggregation is enabled", async () => {
		// @ts-expect-error - Mocking inquirer prompt with simplified implementation
		vi.spyOn(inquirer, "prompt").mockImplementation(async (args: unknown) => {
			const question = (Array.isArray(args) ? args[0] : args) as {
				name: string;
				default?: unknown;
				type?: string;
				choices?: unknown[];
			};

			// Map of responses for metrics and aggregation enabled
			const responses: Record<string, string | undefined> = {
				API_OTEL_ENABLED: "false",
				API_METRICS_ENABLED: "true",
				API_METRICS_API_KEY: "", // Empty string should become undefined in the code
				API_METRICS_SLOW_REQUEST_MS: "500",
				API_METRICS_SLOW_OPERATION_MS: "200",
				API_METRICS_AGGREGATION_ENABLED: "true",
				API_METRICS_AGGREGATION_CRON_SCHEDULE: "*/10 * * * *",
				API_METRICS_AGGREGATION_WINDOW_MINUTES: "10",
				API_METRICS_CACHE_TTL_SECONDS: "600",
				API_METRICS_SNAPSHOT_RETENTION_COUNT: "2000",
			};

			const value = responses[question.name];
			// Return the mapped value if it exists (including empty string), otherwise use default
			return {
				[question.name]: value ?? question.default ?? "default-value",
			};
		});

		const answers: Partial<SetupAnswers> = {};
		await observabilitySetup(answers as SetupAnswers);

		expect(answers.API_METRICS_ENABLED).toBe("true");
		expect(answers.API_METRICS_API_KEY).toBeUndefined(); // Empty string should become undefined
		expect(answers.API_METRICS_AGGREGATION_ENABLED).toBe("true");
		expect(answers.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBe("*/10 * * * *");
		expect(answers.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBe("10");
		expect(answers.API_METRICS_CACHE_TTL_SECONDS).toBe("600");
		expect(answers.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe("2000");
	});

	it("should skip metrics prompts when metrics are disabled", async () => {
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
			if (question.name === "API_METRICS_ENABLED")
				return { API_METRICS_ENABLED: "false" };

			// Metrics-specific prompts should not be called
			if (
				question.name.startsWith("API_METRICS_") &&
				question.name !== "API_METRICS_ENABLED"
			) {
				throw new Error(
					`Should not prompt for ${question.name} when metrics are disabled`,
				);
			}

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

		expect(answers.API_METRICS_ENABLED).toBe("false");
		expect(answers.API_METRICS_API_KEY).toBeUndefined();
		expect(answers.API_METRICS_SLOW_REQUEST_MS).toBeUndefined();
	});
});
