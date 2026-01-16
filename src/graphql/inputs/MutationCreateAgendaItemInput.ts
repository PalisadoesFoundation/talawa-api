import { z } from "zod";
import { postAttachmentMimeTypeEnum } from "~/src/drizzle/enums/postAttachmentMimeType";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";
import { AgendaItemType } from "~/src/graphql/enums/AgendaItemType";
import { PostAttachmentMimeType } from "../enums/PostAttachmentMimeType";

export const mutationCreateAgendaItemInputSchema = agendaItemsTableInsertSchema
	.pick({
		description: true,
		duration: true,
		eventId: true,
		folderId: true,
		categoryId: true,
		key: true,
		name: true,
		sequence: true,
		type: true,
	})
	.extend({
		folderId: z.string().uuid().optional(),
		categoryId: z.string().uuid().optional(),
		url: z
			.array(
				z.object({
					url: z.string().url(),
				}),
			)
			.optional(),
		attachments: z
			.array(
				z.object({
					name: z.string().min(1),
					mimeType: z.enum(postAttachmentMimeTypeEnum.options),
					objectName: z.string().min(1),
					fileHash: z.string().min(1),
				}),
			)
			.optional(),
	})
	.superRefine((arg, ctx) => {
		if (arg.type === "note") {
			if (arg.duration !== undefined && arg.key !== undefined) {
				ctx.addIssue({
					code: "custom",
					message: `Cannot be provided for an agenda item of type "${arg.type}".`,
					path: ["duration"],
				});
				ctx.addIssue({
					code: "custom",
					message: `Cannot be provided for an agenda item of type "${arg.type}".`,
					path: ["key"],
				});
			} else if (arg.duration !== undefined) {
				ctx.addIssue({
					code: "custom",
					message: `Cannot be provided for an agenda item of type "${arg.type}".`,
					path: ["duration"],
				});
			} else if (arg.key !== undefined) {
				ctx.addIssue({
					code: "custom",
					message: `Cannot be provided for an agenda item of type "${arg.type}".`,
					path: ["key"],
				});
			}
		}

		if (
			(arg.type === "general" || arg.type === "scripture") &&
			arg.key !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: `Cannot be provided for an agenda item of type "${arg.type}".`,
				path: ["key"],
			});
		}
	});

const AgendaItemUrlInput = builder.inputType("AgendaItemUrlInput", {
	description: "URL associated with an agenda item",
	fields: (t) => ({
		url: t.string({
			description: "URL of the agenda item",
			required: true,
		}),
	}),
});

const AgendaItemAttachmentInput = builder.inputType(
	"AgendaItemAttachmentInput",
	{
		description: "Attachment data for an agenda item",
		fields: (t) => ({
			name: t.string({ required: true }),
			mimeType: t.field({
				required: true,
				type: PostAttachmentMimeType,
			}),
			objectName: t.string({ required: true }),
			fileHash: t.string({ required: true }),
		}),
	},
);

export const MutationCreateAgendaItemInput = builder
	.inputRef<z.infer<typeof mutationCreateAgendaItemInputSchema>>(
		"MutationCreateAgendaItemInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			attachments: t.field({
				description: "Attachments for the agenda items.",
				required: false,
				type: [AgendaItemAttachmentInput],
			}),
			description: t.string({
				description: "Custom information about the agenda item.",
			}),
			categoryId: t.id({
				description: "Category id",
			}),
			duration: t.string({
				description: "Duration of the agenda item.",
			}),
			eventId: t.id({
				description:
					"Global identifier of the event the agenda item is associated to.",
				required: true,
			}),
			folderId: t.id({
				description:
					"Global identifier of the agenda folder the agenda item is associated to.",
			}),
			key: t.string({
				description: `Key of the agenda item if it's of a "song" type. More information at [this](https://en.wikipedia.org/wiki/Key_(music)) link.`,
			}),
			name: t.string({
				description: "Name of the agenda item.",
				required: true,
			}),
			sequence: t.int({
				description: "Sequence of the AgendaItem.",
				required: true,
			}),
			type: t.field({
				description: "Type of the agenda item.",
				required: true,
				type: AgendaItemType,
			}),
			url: t.field({
				description: "URLs associated with the agenda item.",
				type: [AgendaItemUrlInput],
				required: false,
			}),
		}),
	});
