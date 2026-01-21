import { z } from "zod";
import {
	AGENDA_ITEM_DESCRIPTION_MAX_LENGTH,
	AGENDA_ITEM_NAME_MAX_LENGTH,
	agendaItemsTableInsertSchema,
} from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";
import {
	FileMetadataInput,
	fileMetadataInputSchema,
} from "./FileMetadataInput";

export const MutationUpdateAgendaItemInputSchema = agendaItemsTableInsertSchema
	.pick({
		duration: true,
		key: true,
	})
	.partial()
	.extend({
		attachments: z.array(fileMetadataInputSchema).max(10).optional(),
		description: sanitizedStringSchema
			.min(1)
			.max(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH)
			.optional(),
		folderId: agendaItemsTableInsertSchema.shape.folderId.optional(),
		id: agendaItemsTableInsertSchema.shape.id.unwrap(),
		name: sanitizedStringSchema
			.min(1)
			.max(AGENDA_ITEM_NAME_MAX_LENGTH)
			.optional(),
		url: z
			.array(z.object({ url: z.string().url() }))
			.max(5)
			.optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

const UpdateAgendaItemUrlInput = builder.inputType("UpdateAgendaItemUrlInput", {
	description: "URL associated with an agenda item",
	fields: (t) => ({
		url: t.string({
			description: "URL of the agenda item",
			required: true,
		}),
	}),
});

export const MutationUpdateAgendaItemInput = builder
	.inputRef<z.infer<typeof MutationUpdateAgendaItemInputSchema>>(
		"MutationUpdateAgendaItemInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			attachments: t.field({
				description:
					"File metadata for attachments uploaded via MinIO presigned URLs.",
				required: false,
				type: [FileMetadataInput],
			}),
			description: t.string({
				description: "Custom information about the agenda item.",
				required: false,
			}),
			duration: t.string({
				description: "Duration of the agenda item.",
				required: false,
			}),
			folderId: t.id({
				description: "Global identifier of the associated agenda folder.",
				required: false,
			}),
			id: t.id({
				description: "Global identifier of the agenda item.",
				required: true,
			}),
			key: t.string({
				description: `Key of the agenda item if it's of a "song" type. More information at [this](https://en.wikipedia.org/wiki/Key_(music)) link.`,
				required: false,
			}),
			name: t.string({
				description: "Name of the agenda item.",
				required: false,
			}),
			url: t.field({
				type: [UpdateAgendaItemUrlInput],
				required: false,
			}),
		}),
	});
