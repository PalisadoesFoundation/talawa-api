import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for complexity range validation.
 * Defines min and max complexity values.
 */
export const complexityRangeSchema = z
	.object({
		min: z.number().nonnegative("Complexity min must be a non-negative number"),
		max: z.number().nonnegative("Complexity max must be a non-negative number"),
	})
	.superRefine((arg, ctx) => {
		if (arg.min > arg.max) {
			ctx.addIssue({
				code: "custom",
				message: `Complexity min must be less than or equal to max. min: ${arg.min}, max: ${arg.max}`,
				path: ["min"],
			});
		}
	});

/**
 * GraphQL input type for complexity range.
 * Defines min and max complexity values for filtering.
 * Must be defined before MetricsFilterInput to be used as a field type.
 */
export const ComplexityRangeInput = builder
	.inputRef<z.infer<typeof complexityRangeSchema>>("ComplexityRangeInput")
	.implement({
		description:
			"Input type for defining a complexity range filter. Both min and max must be non-negative numbers, and min must be less than or equal to max.",
		fields: (t) => ({
			min: t.float({
				description:
					"Minimum complexity score (inclusive). Must be non-negative and less than or equal to max.",
				required: true,
			}),
			max: t.float({
				description:
					"Maximum complexity score (inclusive). Must be non-negative and greater than or equal to min.",
				required: true,
			}),
		}),
	});

/**
 * Zod schema for MetricsFilterInput validation.
 * Defines advanced filtering options for metrics queries.
 */
export const metricsFilterInputSchema = z.object({
	operationNames: z
		.array(z.string().min(1, "Operation names must be non-empty strings"))
		.min(1, "At least one operation name must be provided")
		.optional(),
	slowOperationsOnly: z.boolean().default(false),
	minCacheHitRate: z
		.number()
		.min(0, "minCacheHitRate must be between 0 and 1")
		.max(1, "minCacheHitRate must be between 0 and 1")
		.optional(),
	complexityRange: complexityRangeSchema.optional(),
});

/**
 * TypeScript type inferred from the MetricsFilterInput Zod schema.
 */
export type MetricsFilterInput = z.infer<typeof metricsFilterInputSchema>;

/**
 * GraphQL input type for advanced metrics filtering.
 * Provides filtering by operation names, slow operations, cache hit rate, and complexity range.
 */
export const MetricsFilterInput = builder
	.inputRef<MetricsFilterInput>("MetricsFilterInput")
	.implement({
		description:
			"Input type for advanced metrics filtering. Supports filtering by operation names, slow operations, cache hit rate, and complexity range.",
		fields: (t) => ({
			operationNames: t.stringList({
				description:
					"Optional array of operation names to filter by. If provided, only metrics for these operations will be returned.",
				required: false,
			}),
			slowOperationsOnly: t.boolean({
				description:
					"If true, only return metrics for operations that exceeded the slow threshold. Defaults to false.",
				required: false,
			}),
			minCacheHitRate: t.float({
				description:
					"Optional minimum cache hit rate filter (0-1). Only metrics with a cache hit rate greater than or equal to this value will be returned.",
				required: false,
			}),
			complexityRange: t.field({
				description:
					"Optional complexity range filter. Only metrics with complexity scores within this range will be returned.",
				required: false,
				type: ComplexityRangeInput,
			}),
		}),
	});
