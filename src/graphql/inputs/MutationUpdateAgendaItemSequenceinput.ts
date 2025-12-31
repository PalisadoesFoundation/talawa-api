import type { z } from "zod";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";

export const MutationUpdateAgendaItemSequenceInputSchema = agendaItemsTableInsertSchema
	.pick({
		sequence: true
	})
	.extend({
		id: agendaItemsTableInsertSchema.shape.id.unwrap(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateAgendaItemSequenceInput = builder
	.inputRef<z.infer<typeof MutationUpdateAgendaItemSequenceInputSchema>>(
		"MutationUpdateAgendaItemSequenceInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the agenda item.",
				required: true,
			}),
			sequence: t.int({
				description: "Sequence of agenda item.",
				required: true,
			})
		}),
	});
