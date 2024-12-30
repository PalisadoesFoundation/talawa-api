import { z } from "zod";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteAgendaItemInputSchema = z.object({
	id: agendaItemsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteAgendaItemInput = builder
	.inputRef<z.infer<typeof mutationDeleteAgendaItemInputSchema>>(
		"MutationDeleteAgendaItemInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the agenda item.",
				required: true,
			}),
		}),
	});
