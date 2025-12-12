import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";
import { RecurrenceInput, recurrenceInputSchema } from "./RecurrenceInput";

export const mutationCreateEventInputSchema = eventsTableInsertSchema
	.pick({
		endAt: true,
		organizationId: true,
		startAt: true,
	})
	.extend({
		description: sanitizedStringSchema.min(1).max(2048).optional(),
		name: sanitizedStringSchema.min(1).max(256),
		attachments: z
			.custom<Promise<FileUpload>>()
			.array()
			.min(1)
			.max(20)
			.optional(),
		allDay: z.boolean().optional(),
		isPublic: z.boolean().optional(),
		isRegisterable: z.boolean().optional(),
		location: z.string().min(1).max(1024).optional(),
		recurrence: recurrenceInputSchema.optional(),
	})
	.superRefine((arg, ctx) => {
		if (arg.endAt <= arg.startAt) {
			ctx.addIssue({
				code: "custom",
				message: `Must be greater than the value: ${arg.startAt.toISOString()}`,
				path: ["endAt"],
			});
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
				type: t.listRef("Upload", { required: true }),
				// Keep the list optional...
				required: false,
			}),
			description: t.string({
				description: "Custom information about the event.",
			}),
			endAt: t.field({
				description: "Date time at the time the event ends at.",
				required: true,
				type: "DateTime",
			}),
			name: t.string({
				description: "Name of the event.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			startAt: t.field({
				description: "Date time at the time the event starts at.",
				required: true,
				type: "DateTime",
			}),
			allDay: t.boolean({
				description: "Indicates if the event spans the entire day",
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
