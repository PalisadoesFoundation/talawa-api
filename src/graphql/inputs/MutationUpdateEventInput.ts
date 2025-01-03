import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateEventInputSchema = z
	.object({
		description: eventsTableInsertSchema.shape.description.optional(),
		endAt: eventsTableInsertSchema.shape.endAt.optional(),
		id: eventsTableInsertSchema.shape.id.unwrap(),
		name: eventsTableInsertSchema.shape.name.optional(),
		startAt: eventsTableInsertSchema.shape.startAt.optional(),
	})
	.superRefine(({ id, ...remainingArg }, ctx) => {
		if (!Object.values(remainingArg).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one optional argument must be provided.",
			});
		}

		if (
			isNotNullish(remainingArg.endAt) &&
			isNotNullish(remainingArg.startAt) &&
			remainingArg.endAt <= remainingArg.startAt
		) {
			ctx.addIssue({
				code: "custom",
				message: `Must be greater than the value: ${remainingArg.startAt.toISOString()}.`,
				path: ["endAt"],
			});
		}
	});

export const MutationUpdateEventInput = builder
	.inputRef<z.infer<typeof mutationUpdateEventInputSchema>>(
		"MutationUpdateEventInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			description: t.string({
				description: "Custom information about the event.",
			}),
			endAt: t.field({
				description: "Date time at the time the event ends at.",
				type: "DateTime",
			}),
			id: t.id({
				description: "Global identifier of the event.",
				required: true,
			}),
			name: t.string({
				description: "Name of the event.",
			}),
			startAt: t.field({
				description: "Date time at the time the event starts at.",
				type: "DateTime",
			}),
		}),
	});
