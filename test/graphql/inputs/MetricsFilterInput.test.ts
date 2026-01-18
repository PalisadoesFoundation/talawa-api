import { describe, expect, it } from "vitest";
import {
	complexityRangeSchema,
	type MetricsFilterInput,
	metricsFilterInputSchema,
} from "~/src/graphql/inputs/MetricsFilterInput";

/**
 * Tests for MetricsFilterInput schema validation.
 * Validates operation names, slow operations, cache hit rate, and complexity range filtering.
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
describe("MetricsFilterInput Schema", () => {
	// operationNames field tests
	it("should accept valid operationNames array", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: ["query", "mutation"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationNames).toEqual(["query", "mutation"]);
		}
	});

	it("should accept single operation name", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: ["query"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationNames).toEqual(["query"]);
		}
	});

	it("should accept multiple operation names", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: ["query", "mutation", "subscription"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationNames).toHaveLength(3);
		}
	});

	it("should reject empty operationNames array", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: [],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain(
				"At least one operation name must be provided",
			);
		}
	});

	it("should reject operationNames with empty strings", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: [""],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain(
				"Operation names must be non-empty strings",
			);
		}
	});

	it("should reject operationNames with whitespace-only strings", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: ["   "],
		});
		expect(result.success).toBe(false);
	});

	it("should reject operationNames with mixed valid and invalid strings", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: ["query", ""],
		});
		expect(result.success).toBe(false);
	});

	it("should accept undefined operationNames", () => {
		const result = metricsFilterInputSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationNames).toBeUndefined();
		}
	});

	it("should reject non-array operationNames", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: "query" as unknown as string[],
		});
		expect(result.success).toBe(false);
	});

	it("should reject operationNames with non-string elements", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: [123] as unknown as string[],
		});
		expect(result.success).toBe(false);
	});

	// slowOperationsOnly field tests
	it("should default slowOperationsOnly to false when not provided", () => {
		const result = metricsFilterInputSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.slowOperationsOnly).toBe(false);
		}
	});

	it("should accept slowOperationsOnly as true", () => {
		const result = metricsFilterInputSchema.safeParse({
			slowOperationsOnly: true,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.slowOperationsOnly).toBe(true);
		}
	});

	it("should accept slowOperationsOnly as false", () => {
		const result = metricsFilterInputSchema.safeParse({
			slowOperationsOnly: false,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.slowOperationsOnly).toBe(false);
		}
	});

	it("should reject non-boolean slowOperationsOnly", () => {
		const result = metricsFilterInputSchema.safeParse({
			slowOperationsOnly: "true" as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	it("should reject null slowOperationsOnly", () => {
		const result = metricsFilterInputSchema.safeParse({
			slowOperationsOnly: null as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	// minCacheHitRate field tests
	it("should accept valid minCacheHitRate at minimum (0)", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: 0,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minCacheHitRate).toBe(0);
		}
	});

	it("should accept valid minCacheHitRate at maximum (1)", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: 1,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minCacheHitRate).toBe(1);
		}
	});

	it("should accept valid minCacheHitRate in middle (0.5)", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: 0.5,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minCacheHitRate).toBe(0.5);
		}
	});

	it("should accept valid minCacheHitRate as decimal (0.75)", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: 0.75,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minCacheHitRate).toBe(0.75);
		}
	});

	it("should reject minCacheHitRate below 0", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: -0.1,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("must be between 0 and 1");
		}
	});

	it("should reject minCacheHitRate above 1", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: 1.1,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("must be between 0 and 1");
		}
	});

	it("should accept undefined minCacheHitRate", () => {
		const result = metricsFilterInputSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.minCacheHitRate).toBeUndefined();
		}
	});

	it("should reject non-number minCacheHitRate", () => {
		const result = metricsFilterInputSchema.safeParse({
			minCacheHitRate: "0.5" as unknown as number,
		});
		expect(result.success).toBe(false);
	});

	// complexityRange field tests
	it("should accept valid complexityRange", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 0,
				max: 100,
			},
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.complexityRange?.min).toBe(0);
			expect(result.data.complexityRange?.max).toBe(100);
		}
	});

	it("should accept complexityRange with min equal to max", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 50,
				max: 50,
			},
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.complexityRange?.min).toBe(50);
			expect(result.data.complexityRange?.max).toBe(50);
		}
	});

	it("should accept complexityRange with zero values", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 0,
				max: 0,
			},
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.complexityRange?.min).toBe(0);
			expect(result.data.complexityRange?.max).toBe(0);
		}
	});

	it("should reject complexityRange with min greater than max", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 100,
				max: 50,
			},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain(
				"Complexity min must be less than or equal to max",
			);
		}
	});

	it("should reject complexityRange with negative min", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: -10,
				max: 100,
			},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("must be a non-negative number");
		}
	});

	it("should reject complexityRange with negative max", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 0,
				max: -10,
			},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errorMessage = result.error.issues[0]?.message;
			expect(errorMessage).toContain("must be a non-negative number");
		}
	});

	it("should reject complexityRange with missing min", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				max: 100,
			},
		});
		expect(result.success).toBe(false);
	});

	it("should reject complexityRange with missing max", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 0,
			},
		});
		expect(result.success).toBe(false);
	});

	it("should accept undefined complexityRange", () => {
		const result = metricsFilterInputSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.complexityRange).toBeUndefined();
		}
	});

	it("should reject complexityRange with non-number min", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: "0" as unknown as number,
				max: 100,
			},
		});
		expect(result.success).toBe(false);
	});

	it("should reject complexityRange with non-number max", () => {
		const result = metricsFilterInputSchema.safeParse({
			complexityRange: {
				min: 0,
				max: "100" as unknown as number,
			},
		});
		expect(result.success).toBe(false);
	});

	// Combined field tests
	it("should accept all fields together", () => {
		const result = metricsFilterInputSchema.safeParse({
			operationNames: ["query", "mutation"],
			slowOperationsOnly: true,
			minCacheHitRate: 0.8,
			complexityRange: {
				min: 10,
				max: 50,
			},
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationNames).toEqual(["query", "mutation"]);
			expect(result.data.slowOperationsOnly).toBe(true);
			expect(result.data.minCacheHitRate).toBe(0.8);
			expect(result.data.complexityRange?.min).toBe(10);
			expect(result.data.complexityRange?.max).toBe(50);
		}
	});

	it("should accept empty object (all fields optional)", () => {
		const result = metricsFilterInputSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.operationNames).toBeUndefined();
			expect(result.data.minCacheHitRate).toBeUndefined();
			expect(result.data.complexityRange).toBeUndefined();
		}
	});

	// ComplexityRangeSchema standalone tests
	describe("complexityRangeSchema", () => {
		it("should accept valid complexity range", () => {
			const result = complexityRangeSchema.safeParse({
				min: 0,
				max: 100,
			});
			expect(result.success).toBe(true);
		});

		it("should reject min greater than max", () => {
			const result = complexityRangeSchema.safeParse({
				min: 100,
				max: 50,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const errorMessage = result.error.issues[0]?.message;
				expect(errorMessage).toContain(
					"Complexity min must be less than or equal to max",
				);
				expect(result.error.issues[0]?.path).toContain("min");
			}
		});

		it("should accept min equal to max", () => {
			const result = complexityRangeSchema.safeParse({
				min: 50,
				max: 50,
			});
			expect(result.success).toBe(true);
		});

		it("should reject negative min", () => {
			const result = complexityRangeSchema.safeParse({
				min: -10,
				max: 100,
			});
			expect(result.success).toBe(false);
		});

		it("should reject negative max", () => {
			const result = complexityRangeSchema.safeParse({
				min: 0,
				max: -10,
			});
			expect(result.success).toBe(false);
		});
	});

	// TypeScript type export test
	it("should export MetricsFilterInput type", () => {
		const input: MetricsFilterInput = {
			slowOperationsOnly: false,
		};
		expect(input).toBeDefined();
		expect(input.slowOperationsOnly).toBe(false);
	});
});
