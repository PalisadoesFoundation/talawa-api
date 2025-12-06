import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";

export const queryOrganizationPostsInputSchema = z.object({
	organizationId: organizationsTableInsertSchema.shape.id.unwrap(),
});

export const QueryOrganizationPostsInput = builder.inputType(
	"QueryOrganizationPostsInput",
	{
		description: "Input for querying posts of an organization.",
		fields: (t) => ({
			organizationId: t.id({
				description: "Global identifier of the organization.",
				required: true,
			}),
		}),
	},
);
