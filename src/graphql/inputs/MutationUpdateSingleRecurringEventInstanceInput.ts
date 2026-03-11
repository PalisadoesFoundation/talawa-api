import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateSingleRecurringEventInstanceInputSchema = z
	.object({
		id: z.string().uuid({
			message: "Must be a valid UUID for the recurring event instance ID.",
		}),
		name: z
			.string()
			.min(1, "Name must be at least 1 character long.")
			.max(256, "Name must be at most 256 characters long.")
			.optional(),
		description: z
			.string()
			.min(1, "Description must be at least 1 character long.")
			.max(2048, "Description must be at most 2048 characters long.")
			.optional(),
		location: z
			.string()
			.min(1, "Location must be at least 1 character long.")
			.max(1024, "Location must be at most 1024 characters long.")
			.optional(),
		// Timed event fields (allDay = false)
		startAt: z.date().optional(),
		endAt: z.date().optional(),
		// All-day event fields (allDay = true; YYYY-MM-DD strings)
		startDate: z.string().date().optional(),
		endDate: z.string().date().optional(),
		allDay: z.boolean().optional(),
		isPublic: z.boolean().optional(),
		isRegisterable: z.boolean().optional(),
		isInviteOnly: z.boolean().optional(),
	})
	.superRefine(({ id, ...remainingArgs }, ctx) => {
		const hasTimedFields =
			isNotNullish(remainingArgs.startAt) || isNotNullish(remainingArgs.endAt);
		const hasAllDayFields =
			isNotNullish(remainingArgs.startDate) ||
			isNotNullish(remainingArgs.endDate);

		if (hasTimedFields && hasAllDayFields) {
			ctx.addIssue({
				code: "custom",
				message: "Use either startAt/endAt or startDate/endDate, not both.",
			});
		}

		if (remainingArgs.allDay === true && hasTimedFields) {
			ctx.addIssue({
				code: "custom",
				message: "Timed fields are not allowed when allDay is true.",
				path: ["allDay"],
			});
		}

		if (remainingArgs.allDay !== true && hasAllDayFields) {
			ctx.addIssue({
				code: "custom",
				message: "All-day fields require allDay to be true.",
				path: ["allDay"],
			});
		}

		// Ensure at least one field is being updated
		if (!Object.values(remainingArgs).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field must be provided for update.",
			});
		}

		// Validate timed event fields: if both startAt and endAt are provided, endAt must be after startAt
		if (
			isNotNullish(remainingArgs.endAt) &&
			isNotNullish(remainingArgs.startAt) &&
			remainingArgs.endAt <= remainingArgs.startAt
		) {
			ctx.addIssue({
				code: "custom",
				message: `End time must be after start time: ${remainingArgs.startAt.toISOString()}.`,
				path: ["endAt"],
			});
		}

		// Validate all-day event fields: if both startDate and endDate are provided, endDate must be after startDate
		if (
			isNotNullish(remainingArgs.endDate) &&
			isNotNullish(remainingArgs.startDate) &&
			remainingArgs.endDate <= remainingArgs.startDate
		) {
			ctx.addIssue({
				code: "custom",
				message: `End date must be after start date: ${remainingArgs.startDate}.`,
				path: ["endDate"],
			});
		}
	});

export const MutationUpdateSingleRecurringEventInstanceInput = builder
	.inputRef<
		z.infer<typeof mutationUpdateSingleRecurringEventInstanceInputSchema>
	>("MutationUpdateSingleRecurringEventInstanceInput")
	.implement({
		description: "Input for updating a single instance of a recurring event.",
		fields: (t) => ({
			id: t.id({
				description:
					"Global identifier of the recurring event instance to update.",
				required: true,
			}),
			name: t.string({
				description: "Updated name for this specific event instance.",
			}),
			description: t.string({
				description: "Updated description for this specific event instance.",
			}),
			location: t.string({
				description: "Updated location for this specific event instance.",
			}),
			startAt: t.field({
				description:
					"Updated UTC start time for this specific timed event instance.",
				type: "DateTime",
			}),
			endAt: t.field({
				description:
					"Updated UTC end time for this specific timed event instance.",
				type: "DateTime",
			}),
			startDate: t.string({
				description:
					"Inclusive start date (YYYY-MM-DD) for this specific all-day event instance.",
				required: false,
			}),
			endDate: t.string({
				description:
					"Exclusive end date (YYYY-MM-DD) for this specific all-day event instance.",
				required: false,
			}),
			allDay: t.boolean({
				description:
					"Whether this specific event instance spans the entire day.",
			}),
			isPublic: t.boolean({
				description:
					"Whether this specific event instance is publicly visible.",
			}),
			isRegisterable: t.boolean({
				description:
					"Whether users can register for this specific event instance.",
			}),
			isInviteOnly: t.boolean({
				description: "Whether this specific event instance is invite-only.",
				required: false,
			}),
		}),
	});
