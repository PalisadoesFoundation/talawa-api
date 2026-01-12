import type { z } from "zod";
import { agendaCategoriesTableInsertSchema } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";

export const mutationCreateAgendaCategoryInputSchema =
	agendaCategoriesTableInsertSchema.pick({
		eventId: true,
		name: true,
		description: true,
	});

export const MutationCreateAgendaCategoryInput = builder
	.inputRef<z.infer<typeof mutationCreateAgendaCategoryInputSchema>>(
		"MutationCreateAgendaCategoryInput",
	)
	.implement({
		description: "Input for creating an agenda category.",
		fields: (t) => ({
			description: t.string({
				description: "Description of the agenda category.",
				required: false,
			}),
			eventId: t.id({
				description:
					"Global identifier of the event the agenda category is associated to.",
				required: true,
			}),
			name: t.string({
				description: "Name of the agenda category.",
				required: true,
			}),
		}),
	});
