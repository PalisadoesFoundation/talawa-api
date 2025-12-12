import type { z } from "zod";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";

export const MutationUpdateAgendaItemInputSchema = agendaItemsTableInsertSchema
	.pick({
		description: true,
		duration: true,
		key: true,
	})
	.extend({
		folderId: agendaItemsTableInsertSchema.shape.folderId.optional(),
		id: agendaItemsTableInsertSchema.shape.id.unwrap(),
		name: agendaItemsTableInsertSchema.shape.name.optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateAgendaItemInput = builder
	.inputRef<z.infer<typeof MutationUpdateAgendaItemInputSchema>>(
		"MutationUpdateAgendaItemInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			description: t.string({
				description: "Custom information about the agenda item.",
			}),
			duration: t.string({
				description: "Duration of the agenda item.",
			}),
			folderId: t.id({
				description: "Global identifier of the associated agenda folder.",
			}),
			id: t.id({
				description: "Global identifier of the agenda item.",
				required: true,
			}),
			key: t.string({
				description: `Key of the agenda item if it's of a "song" type. More information at [this](https://en.wikipedia.org/wiki/Key_(music)) link.`,
			}),
			name: t.string({
				description: "Name of the agenda item.",
			}),
		}),
	});
