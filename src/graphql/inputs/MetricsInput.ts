import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

/**
 * Zod schema for MetricsInput validation.
 * Defines the input structure for querying metrics data.
 */
export const metricsInputSchema = z
	.object({
		startTime: z.date({
			required_error: "startTime is required",
			invalid_type_error: "startTime must be a valid DateTime",
		}),
		endTime: z.date({
			required_error: "endTime is required",
			invalid_type_error: "endTime must be a valid DateTime",
		}),
		operationType: z
			.string()
			.min(1, "operationType must be a non-empty string")
			.optional(),
		minDuration: z
			.number()
			.positive("minDuration must be a positive number")
			.optional(),
		maxDuration: z
			.number()
			.positive("maxDuration must be a positive number")
			.optional(),
		includeCacheMetrics: z.boolean().default(true),
	})
	.superRefine((arg, ctx) => {
		// Validate that endTime is after startTime
		if (arg.endTime <= arg.startTime) {
			ctx.addIssue({
				code: "custom",
				message: `endTime must be after startTime. startTime: ${arg.startTime.toISOString()}, endTime: ${arg.endTime.toISOString()}`,
				path: ["endTime"],
			});
		}

		// Validate that minDuration is less than maxDuration if both are provided
		if (
			isNotNullish(arg.minDuration) &&
			isNotNullish(arg.maxDuration) &&
			arg.minDuration >= arg.maxDuration
		) {
			ctx.addIssue({
				code: "custom",
				message: `minDuration must be less than maxDuration. minDuration: ${arg.minDuration}, maxDuration: ${arg.maxDuration}`,
				path: ["minDuration"],
			});
		}
	});

/**
 * TypeScript type inferred from the MetricsInput Zod schema.
 */
export type MetricsInput = z.infer<typeof metricsInputSchema>;

/**
 * GraphQL input type for querying metrics data.
 * Provides time range filtering and optional operation type and duration filtering.
 */
export const MetricsInput = builder
	.inputRef<MetricsInput>("MetricsInput")
	.implement({
		description:
			"Input type for querying metrics data. Supports time range filtering, operation type filtering, and duration-based filtering.",
		fields: (t) => ({
			startTime: t.field({
				description:
					"The start time for the metrics query. Must be a valid DateTime.",
				required: true,
				type: "DateTime",
			}),
			endTime: t.field({
				description:
					"The end time for the metrics query. Must be after startTime.",
				required: true,
				type: "DateTime",
			}),
			operationType: t.string({
				description:
					"Optional filter to limit results to a specific operation type.",
				required: false,
			}),
			minDuration: t.float({
				description:
					"Optional minimum duration filter in milliseconds. Must be positive and less than maxDuration if both are provided.",
				required: false,
			}),
			maxDuration: t.float({
				description:
					"Optional maximum duration filter in milliseconds. Must be positive and greater than minDuration if both are provided.",
				required: false,
			}),
			includeCacheMetrics: t.boolean({
				description:
					"Whether to include cache-related metrics (hits, misses, hit rate). Defaults to true.",
				required: false,
			}),
		}),
	});
