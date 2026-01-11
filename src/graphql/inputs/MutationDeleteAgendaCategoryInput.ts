import { z } from "zod";
import { agendaCategoriesTableInsertSchema } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteAgendaCategoryInputSchema = z.object({
	id: agendaCategoriesTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteAgendaCategoryInput = builder
	.inputRef<z.infer<typeof mutationDeleteAgendaCategoryInputSchema>>(
		"MutationDeleteAgendaCategoryInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the agenda category.",
				required: true,
			}),
		}),
	});
