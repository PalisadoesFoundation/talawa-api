import { z } from "zod";
import { volunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteEventVolunteerGroupInputSchema = z.object({
	id: volunteerGroupsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteEventVolunteerGroupInput = builder
	.inputRef<z.infer<typeof mutationDeleteEventVolunteerGroupInputSchema>>(
		"MutationDeleteEventVolunteerGroupInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the group.",
				required: true,
			}),
		}),
	});
