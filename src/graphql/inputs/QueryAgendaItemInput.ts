import { z } from "zod";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";

export const queryAgendaItemInputSchema = z.object({
	id: agendaItemsTableInsertSchema.shape.id.unwrap(),
});

export const QueryAgendaItemInput = builder
	.inputRef<z.infer<typeof queryAgendaItemInputSchema>>("QueryAgendaItemInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the agenda item.",
				required: true,
			}),
		}),
	});
