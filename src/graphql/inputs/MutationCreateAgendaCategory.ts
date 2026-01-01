import type { z } from "zod";
import { agendaCategoriesTableInsertSchema } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";

export const mutationCreateAgendaCategoriesInputSchema =
	agendaCategoriesTableInsertSchema.pick({
		eventId: true,
		name: true,
		description: true,
	});

export const MutationCreateAgendaCategoriesInput = builder
	.inputRef<z.infer<typeof mutationCreateAgendaCategoriesInputSchema>>(
		"MutationCreateAgendaCategoryInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			description: t.string({
				description: "Description of Agenda Folder",
				required: true,
			}),
			eventId: t.id({
				description:
					"Global identifier of the event the agenda folder is associated to.",
				required: true,
			}),
			name: t.string({
				description: "Name of the agenda folder.",
				required: true,
			}),
			organizationId: t.id({
				description: "ID of the organization this category belongs to.",
				required: false,
			}),
		}),
	});
