import type { z } from "zod";
import { volunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";

export const mutationCreateVolunteerGroupInputSchema =
	volunteerGroupsTableInsertSchema.pick({
		eventId: true,
		name: true,
		leaderId: true,
		maxVolunteerCount: true,
	});

export const MutationCreateVolunteerGroupInput = builder
	.inputRef<z.infer<typeof mutationCreateVolunteerGroupInputSchema>>(
		"MutationCreateVolunteerGroupsInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			eventId: t.id({
				description:
					"Global identifier of the event that the group is to be made for.",
				required: true,
			}),
			name: t.string({
				description: "Name of the group.",
				required: true,
			}),
			leaderId: t.id({
				description:
					"Global identifier of the user that is assigned leader of the group.",
			}),
			maxVolunteerCount: t.int({
				description: "Max volunteers count",
				required: true,
			}),
		}),
	});
