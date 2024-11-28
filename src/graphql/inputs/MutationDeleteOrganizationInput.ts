import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteOrganizationInputSchema = z.object({
	id: organizationsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteOrganizationInput = builder
	.inputRef<z.infer<typeof mutationDeleteOrganizationInputSchema>>(
		"MutationDeleteOrganizationInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the organization.",
				required: true,
			}),
		}),
	});
