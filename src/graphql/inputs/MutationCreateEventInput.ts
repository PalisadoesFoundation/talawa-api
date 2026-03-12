import { z } from "zod";
import {
	EVENT_DESCRIPTION_MAX_LENGTH,
	EVENT_LOCATION_MAX_LENGTH,
	EVENT_NAME_MAX_LENGTH,
	eventsTableInsertSchema,
} from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";
import {
	FileMetadataInput,
	fileMetadataInputSchema,
} from "./FileMetadataInput";
import { RecurrenceInput, recurrenceInputSchema } from "./RecurrenceInput";

export const mutationCreateEventInputSchema = z
	.object({
		organizationId: eventsTableInsertSchema.shape.organizationId,
		name: sanitizedStringSchema.min(1).max(EVENT_NAME_MAX_LENGTH),
		description: sanitizedStringSchema
			.min(1)
			.max(EVENT_DESCRIPTION_MAX_LENGTH)
			.optional(),
		attachments: fileMetadataInputSchema.array().min(1).max(20).optional(),
		allDay: z.boolean().optional(),
		isInviteOnly: z.boolean().optional(),
		isPublic: z.boolean().optional(),
		isRegisterable: z.boolean().optional(),
		location: sanitizedStringSchema
			.min(1)
			.max(EVENT_LOCATION_MAX_LENGTH)
			.optional(),
		recurrence: recurrenceInputSchema.optional(),
		// Timed event fields (required when allDay = false)
		startAt: z.date().optional(),
		endAt: z.date().optional(),
		// All-day event fields (required when allDay = true; YYYY-MM-DD strings)
		startDate: z.string().date().optional(),
		endDate: z.string().date().optional(),
	})
	.superRefine((arg, ctx) => {
		// Check for mixed representations (startAt with startDate or endAt with endDate)
		if (arg.startAt !== undefined && arg.startDate !== undefined) {
			ctx.addIssue({
				code: "custom",
				message:
					"Cannot provide both startAt (timed) and startDate (all-day) in the same payload.",
				path: ["startAt"],
			});
		}
		if (arg.endAt !== undefined && arg.endDate !== undefined) {
			ctx.addIssue({
				code: "custom",
				message:
					"Cannot provide both endAt (timed) and endDate (all-day) in the same payload.",
				path: ["endAt"],
			});
		}

		if (arg.allDay === true) {
			// All-day event: startDate and endDate must be provided, forbid timed fields
			if (!arg.startDate) {
				ctx.addIssue({
					code: "custom",
					message: "startDate is required for all-day events",
					path: ["startDate"],
				});
			}
			if (!arg.endDate) {
				ctx.addIssue({
					code: "custom",
					message: "endDate is required for all-day events",
					path: ["endDate"],
				});
			}
			if (arg.startAt !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide startAt when allDay is true. Use startDate instead.",
					path: ["startAt"],
				});
			}
			if (arg.endAt !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide endAt when allDay is true. Use endDate instead.",
					path: ["endAt"],
				});
			}
			if (arg.startDate && arg.endDate && arg.endDate <= arg.startDate) {
				ctx.addIssue({
					code: "custom",
					message: `Must be greater than the value: ${arg.startDate}`,
					path: ["endDate"],
				});
			}
		} else {
			// Timed event (allDay = false or undefined): startAt and endAt must be provided, forbid all-day fields
			if (!arg.startAt) {
				ctx.addIssue({
					code: "custom",
					message: "startAt is required for timed events",
					path: ["startAt"],
				});
			}
			if (!arg.endAt) {
				ctx.addIssue({
					code: "custom",
					message: "endAt is required for timed events",
					path: ["endAt"],
				});
			}
			if (arg.startDate !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide startDate when allDay is false or omitted. Use startAt instead.",
					path: ["startDate"],
				});
			}
			if (arg.endDate !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide endDate when allDay is false or omitted. Use endAt instead.",
					path: ["endDate"],
				});
			}
			if (arg.startAt && arg.endAt && arg.endAt <= arg.startAt) {
				ctx.addIssue({
					code: "custom",
					message: `Must be greater than the value: ${arg.startAt.toISOString()}`,
					path: ["endAt"],
				});
			}
		}
	});

export const MutationCreateEventInput = builder
	.inputRef<z.infer<typeof mutationCreateEventInputSchema>>(
		"MutationCreateEventInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			attachments: t.field({
				description: "Attachments of the event.",
				required: false,
				type: [FileMetadataInput],
			}),
			description: t.string({
				description: "Custom information about the event.",
			}),
			endAt: t.field({
				description:
					"UTC timestamp at the time the timed event ends. Required when allDay is false.",
				required: false,
				type: "DateTime",
			}),
			startAt: t.field({
				description:
					"UTC timestamp at the time the timed event starts. Required when allDay is false.",
				required: false,
				type: "DateTime",
			}),
			startDate: t.string({
				description:
					"Inclusive start date for all-day events (YYYY-MM-DD). Required when allDay is true.",
				required: false,
			}),
			endDate: t.string({
				description:
					"Exclusive end date for all-day events (YYYY-MM-DD). Required when allDay is true. e.g. March 1 → March 2 is a one-day event.",
				required: false,
			}),
			name: t.string({
				description: "Name of the event.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			allDay: t.boolean({
				description:
					"If true, the event spans the entire day and uses startDate/endDate. If false (default), uses startAt/endAt UTC timestamps.",
				required: false,
			}),
			isInviteOnly: t.boolean({
				description: "Indicates if the event is invite-only",
				required: false,
			}),
			isPublic: t.boolean({
				description: "Indicates if the event is publicly visible",
				required: false,
			}),
			isRegisterable: t.boolean({
				description: "Indicates if users can register for this event",
				required: false,
			}),
			location: t.string({
				description: "Physical or virtual location of the event",
				required: false,
			}),
			recurrence: t.field({
				description:
					"Recurrence pattern for the event. If provided, creates a recurring event.",
				required: false,
				type: RecurrenceInput,
			}),
		}),
	});
