import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateEventInputSchema = z
	.object({
		description: eventsTableInsertSchema.shape.description.optional(),
		endAt: z.date().optional(),
		startAt: z.date().optional(),
		startDate: z.string().date().optional(),
		endDate: z.string().date().optional(),
		allDay: z.boolean().optional(),
		id: eventsTableInsertSchema.shape.id.unwrap(),
		name: eventsTableInsertSchema.shape.name.optional(),
		isInviteOnly: eventsTableInsertSchema.shape.isInviteOnly.optional(),
		isPublic: eventsTableInsertSchema.shape.isPublic.optional(),
		isRegisterable: eventsTableInsertSchema.shape.isRegisterable.optional(),
		location: eventsTableInsertSchema.shape.location.optional(),
	})
	.superRefine(({ id, ...remainingArg }, ctx) => {
		if (!Object.values(remainingArg).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one optional argument must be provided.",
			});
		}
		// Validate timed event: if both startAt and endAt are provided, endAt must be after startAt
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
		// Validate all-day event: if both startDate and endDate are provided, endDate must be after startDate
		if (
			isNotNullish(remainingArg.endDate) &&
			isNotNullish(remainingArg.startDate) &&
			remainingArg.endDate <= remainingArg.startDate
		) {
			ctx.addIssue({
				code: "custom",
				message: `Must be greater than the value: ${remainingArg.startDate}.`,
				path: ["endDate"],
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
				description:
					"UTC timestamp at the time the timed event ends. Only applicable when allDay is false.",
				type: "DateTime",
			}),
			startAt: t.field({
				description:
					"UTC timestamp at the time the timed event starts. Only applicable when allDay is false.",
				type: "DateTime",
			}),
			startDate: t.string({
				description:
					"Inclusive start date for all-day events (YYYY-MM-DD). Only applicable when allDay is true.",
				required: false,
			}),
			endDate: t.string({
				description:
					"Exclusive end date for all-day events (YYYY-MM-DD). Only applicable when allDay is true.",
				required: false,
			}),
			id: t.id({
				description: "Global identifier of the event.",
				required: true,
			}),
			name: t.string({
				description: "Name of the event.",
			}),
			allDay: t.boolean({
				description:
					"If true, converts the event to all-day (requires startDate/endDate). If false, converts to timed (requires startAt/endAt).",
			}),
			isInviteOnly: t.boolean({
				description: "Indicates if the event is invite-only",
				required: false,
			}),
			isPublic: t.boolean({
				description: "Indicates if the event is publicly visible.",
			}),
			isRegisterable: t.boolean({
				description: "Indicates if users can register for this event.",
			}),
			location: t.string({
				description: "Physical or virtual location of the event.",
			}),
		}),
	});
