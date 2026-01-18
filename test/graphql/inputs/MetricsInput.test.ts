import { describe, expect, it } from "vitest";
import {
	type MetricsInput,
	metricsInputSchema,
} from "~/src/graphql/inputs/MetricsInput";

/**
 * Tests for MetricsInput schema validation.
 * Validates time range filtering, operation type filtering, and duration-based filtering.
 *
 * Testing Approach:
 * These tests validate the Zod schema directly using .safeParse() rather than GraphQL
 * integration tests with mercuriusClient. This approach is preferred because:
 * 1. These input schemas are not yet wired to GraphQL resolvers (resolvers will be added in PR 6b)
 * 2. Unit testing the schema ensures validation logic is correct before integration
 * 3. GraphQL integration tests will be added when resolvers are implemented to test end-to-end
 *
 * Once resolvers are added, integration tests using mercuriusClient should be added to
 * verify the full GraphQL layer validation including error message formatting.
 */
describe("MetricsInput Schema", () => {
	const validInput: MetricsInput = {
		startTime: new Date("2024-01-01T10:00:00Z"),
		endTime: new Date("2024-01-01T12:00:00Z"),
		includeCacheMetrics: true,
	};

	// Required fields tests
	it("should accept valid input with required fields only", () => {
		const result = metricsInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.startTime).toEqual(validInput.startTime);
			expect(result.data.endTime).toEqual(validInput.endTime);
			expect(result.data.operationType).toBeUndefined();
			expect(result.data.minDuration).toBeUndefined();
			expect(result.data.maxDuration).toBeUndefined();
		}
	});

	it("should reject missing startTime", () => {
		const result = metricsInputSchema.safeParse({
			endTime: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.path).toContain("startTime");
		}
	});

	it("should reject missing endTime", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T10:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.path).toContain("endTime");
		}
	});

	// DateTime validation tests
	it("should reject invalid startTime type", () => {
		const result = metricsInputSchema.safeParse({
			startTime: "invalid-date",
			endTime: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(false);
	});

	it("should reject invalid endTime type", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T10:00:00Z"),
			endTime: "invalid-date",
		});
		expect(result.success).toBe(false);
	});

	it("should accept Date objects for startTime and endTime", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T10:00:00Z"),
			endTime: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(true);
	});

	// Date range validation tests
	it("should reject endTime equal to startTime", () => {
		const sameTime = new Date("2024-01-01T10:00:00Z");
		const result = metricsInputSchema.safeParse({
			startTime: sameTime,
			endTime: sameTime,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("endTime must be after startTime");
		}
	});

	it("should reject endTime before startTime", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T12:00:00Z"),
			endTime: new Date("2024-01-01T10:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("endTime must be after startTime");
			expect(result.error.issues[0]?.path).toContain("endTime");
		}
	});

	it("should accept endTime after startTime", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T10:00:00Z"),
			endTime: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(true);
	});

	// operationType field tests
	it("should accept valid operationType", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			operationType: "query",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationType).toBe("query");
		}
	});

	it("should accept operationType with multiple characters", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			operationType: "mutation.createUser",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationType).toBe("mutation.createUser");
		}
	});

	it("should reject empty string operationType", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			operationType: "",
		});
		expect(result.success).toBe(false);
	});

	it("should reject whitespace-only operationType", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			operationType: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("should accept undefined operationType", () => {
		const result = metricsInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationType).toBeUndefined();
		}
	});

	it("should reject non-string operationType", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			operationType: 123 as unknown as string,
		});
		expect(result.success).toBe(false);
	});

	// minDuration and maxDuration field tests
	it("should accept valid minDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 100,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minDuration).toBe(100);
		}
	});

	it("should accept valid maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			maxDuration: 500,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.maxDuration).toBe(500);
		}
	});

	it("should accept both minDuration and maxDuration when minDuration < maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 100,
			maxDuration: 500,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minDuration).toBe(100);
			expect(result.data.maxDuration).toBe(500);
		}
	});

	it("should reject minDuration equal to maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 100,
			maxDuration: 100,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain(
				"minDuration must be less than maxDuration",
			);
			expect(result.error.issues[0]?.path).toContain("minDuration");
		}
	});

	it("should reject minDuration greater than maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 500,
			maxDuration: 100,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain(
				"minDuration must be less than maxDuration",
			);
		}
	});

	it("should reject negative minDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: -10,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("must be a positive number");
		}
	});

	it("should reject zero minDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 0,
		});
		expect(result.success).toBe(false);
	});

	it("should reject negative maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			maxDuration: -10,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("must be a positive number");
		}
	});

	it("should reject zero maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			maxDuration: 0,
		});
		expect(result.success).toBe(false);
	});

	it("should reject non-number minDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: "100" as unknown as number,
		});
		expect(result.success).toBe(false);
	});

	it("should reject non-number maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			maxDuration: "500" as unknown as number,
		});
		expect(result.success).toBe(false);
	});

	it("should accept decimal minDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 100.5,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minDuration).toBe(100.5);
		}
	});

	it("should accept decimal maxDuration", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			maxDuration: 500.75,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.maxDuration).toBe(500.75);
		}
	});

	// includeCacheMetrics field tests
	it("should default includeCacheMetrics to true when not provided", () => {
		const result = metricsInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.includeCacheMetrics).toBe(true);
		}
	});

	it("should accept includeCacheMetrics as true", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			includeCacheMetrics: true,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.includeCacheMetrics).toBe(true);
		}
	});

	it("should accept includeCacheMetrics as false", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			includeCacheMetrics: false,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.includeCacheMetrics).toBe(false);
		}
	});

	it("should reject non-boolean includeCacheMetrics", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			includeCacheMetrics: "true" as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	it("should reject null includeCacheMetrics", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			includeCacheMetrics: null as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	// Combined field tests
	it("should accept all optional fields together", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T10:00:00Z"),
			endTime: new Date("2024-01-01T12:00:00Z"),
			operationType: "query",
			minDuration: 100,
			maxDuration: 500,
			includeCacheMetrics: false,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationType).toBe("query");
			expect(result.data.minDuration).toBe(100);
			expect(result.data.maxDuration).toBe(500);
			expect(result.data.includeCacheMetrics).toBe(false);
		}
	});

	// Error message tests
	it("should provide clear error message for date range validation", () => {
		const result = metricsInputSchema.safeParse({
			startTime: new Date("2024-01-01T12:00:00Z"),
			endTime: new Date("2024-01-01T10:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("endTime must be after startTime");
			expect(errorMessage).toContain("startTime:");
			expect(errorMessage).toContain("endTime:");
		}
	});

	it("should provide clear error message for duration range validation", () => {
		const result = metricsInputSchema.safeParse({
			...validInput,
			minDuration: 500,
			maxDuration: 100,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain(
				"minDuration must be less than maxDuration",
			);
			expect(errorMessage).toContain("minDuration:");
			expect(errorMessage).toContain("maxDuration:");
		}
	});

	// TypeScript type export test
	it("should export MetricsInput type", () => {
		const input: MetricsInput = {
			startTime: new Date("2024-01-01T10:00:00Z"),
			endTime: new Date("2024-01-01T12:00:00Z"),
			includeCacheMetrics: true,
		};
		expect(input).toBeDefined();
		expect(input.startTime).toBeInstanceOf(Date);
		expect(input.endTime).toBeInstanceOf(Date);
	});
});
