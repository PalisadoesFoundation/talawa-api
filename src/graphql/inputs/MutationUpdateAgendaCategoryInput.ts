import type { z } from "zod";
import { agendaCategoriesTableInsertSchema } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateAgendaCategoryInputSchema =
	agendaCategoriesTableInsertSchema
		.pick({
			id: true,
			description: true,
			name: true,
		})
		.extend({
			id: agendaCategoriesTableInsertSchema.shape.id.unwrap(),
			name: agendaCategoriesTableInsertSchema.shape.name.optional(),
		})
		.refine(
			({ id, ...remainingArg }) =>
				Object.values(remainingArg).some((value) => value !== undefined),
			{
				message: "At least one optional argument must be provided.",
			},
		);

export const MutationUpdateAgendaCategoryInput = builder
	.inputRef<z.infer<typeof mutationUpdateAgendaCategoryInputSchema>>(
		"MutationUpdateAgendaCategoryInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			description: t.string({
				description: "Description of the agenda category.",
			}),
			id: t.id({
				description: "Global identifier of the agenda category.",
				required: true,
			}),
			name: t.string({
				description: "Name of the agenda category.",
			}),
		}),
	});