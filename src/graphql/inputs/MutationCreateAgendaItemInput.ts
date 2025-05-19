import type { z } from "zod";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";
import { AgendaItemType } from "~/src/graphql/enums/AgendaItemType";

export const mutationCreateAgendaItemInputSchema = agendaItemsTableInsertSchema
	.pick({
		description: true,
		duration: true,
		folderId: true,
		key: true,
		name: true,
		type: true,
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
			} else {
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

export const MutationCreateAgendaItemInput = builder
	.inputRef<z.infer<typeof mutationCreateAgendaItemInputSchema>>(
		"MutationCreateAgendaItemInput",
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
				description:
					"Global identifier of the agenda folder the agenda item is associated to.",
				required: true,
			}),
			key: t.string({
				description: `Key of the agenda item if it's of a "song" type. More information at [this](https://en.wikipedia.org/wiki/Key_(music)) link.`,
			}),
			name: t.string({
				description: "Name of the agenda item.",
				required: true,
			}),
			type: t.field({
				description: "Type of the agenda item.",
				required: true,
				type: AgendaItemType,
			}),
		}),
	});
