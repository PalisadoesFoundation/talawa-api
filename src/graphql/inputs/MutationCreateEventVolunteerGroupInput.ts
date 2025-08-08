import type { z } from "zod";
import { volunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";

export const mutationCreateVolunteerGroupInputSchema =
	volunteerGroupsTableInsertSchema
		.pick({
			eventId: true,
			name: true,
			leaderId: true,
			maxVolunteerCount: true,
		})
		.superRefine((arg, ctx) => {
			if (arg.maxVolunteerCount <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "Must be greater than the 0",
					path: ["maxVolunteerCount"],
				});
			}
		});

export const MutationCreateVolunteerGroupInput = builder
	.inputRef<z.infer<typeof mutationCreateVolunteerGroupInputSchema>>(
		"MutationCreateEventVolunteerGroupInput",
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
				required: true,
			}),
			maxVolunteerCount: t.int({
				description: "Max volunteers count",
				required: true,
			}),
		}),
	});
