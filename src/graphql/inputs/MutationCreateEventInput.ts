import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationCreateEventInputSchema = eventsTableInsertSchema
	.pick({
		description: true,
		endAt: true,
		name: true,
		organizationId: true,
		startAt: true,
	})
	.extend({
		attachments: z
			.custom<Promise<FileUpload>>()
			.array()
			.min(1)
			.max(20)
			.optional(),
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
				type: t.listRef("Upload"),
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
		}),
	});
