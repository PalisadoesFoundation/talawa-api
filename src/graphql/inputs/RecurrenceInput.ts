import { z } from "zod";
import { frequencyEnum } from "~/src/drizzle/enums/frequency";
import { builder } from "~/src/graphql/builder";
import { Frequency } from "~/src/graphql/enums/Frequency";

export const recurrenceInputSchema = z
	.object({
		frequency: frequencyEnum,
		interval: z.number().int().min(1).max(999).optional(),
		endDate: z.date().optional(),
		count: z.number().int().min(1).max(999).optional(),
		byDay: z.string().array().optional(),
		byMonth: z.number().int().min(1).max(12).array().optional(),
		byMonthDay: z.number().int().min(-31).max(31).array().optional(),
	})
	.superRefine((arg, ctx) => {
		// Either endDate or count must be provided, but not both
		if (arg.endDate && arg.count) {
			ctx.addIssue({
				code: "custom",
				message: "Cannot specify both endDate and count",
			});
		}

		if (!arg.endDate && !arg.count) {
			ctx.addIssue({
				code: "custom",
				message: "Must specify either endDate or count",
			});
		}

		// Validate byMonthDay doesn't contain 0
		if (arg.byMonthDay?.includes(0)) {
			ctx.addIssue({
				code: "custom",
				message: "byMonthDay cannot contain 0",
				path: ["byMonthDay"],
			});
		}
	});

export const RecurrenceInput = builder
	.inputRef<z.infer<typeof recurrenceInputSchema>>("RecurrenceInput")
	.implement({
		description: "Input type for defining recurrence rules for events.",
		fields: (t) => ({
			frequency: t.field({
				description:
					"Frequency of recurrence (DAILY, WEEKLY, MONTHLY, YEARLY).",
				required: true,
				type: Frequency,
			}),
			interval: t.int({
				description:
					"Interval between recurrences (e.g., 2 for every 2 weeks). Defaults to 1.",
				required: false,
			}),
			endDate: t.field({
				description: "Date when the recurrence ends.",
				required: false,
				type: "DateTime",
			}),
			count: t.int({
				description: "Number of occurrences.",
				required: false,
			}),
			byDay: t.stringList({
				description: "Days of the week (e.g., ['MO', 'WE', 'FR']).",
				required: false,
			}),
			byMonth: t.intList({
				description: "Months of the year (1-12).",
				required: false,
			}),
			byMonthDay: t.intList({
				description: "Days of the month (-31 to 31, excluding 0).",
				required: false,
			}),
		}),
	});
