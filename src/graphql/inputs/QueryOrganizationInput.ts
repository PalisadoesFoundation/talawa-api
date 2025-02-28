import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";

export const queryOrganizationInputSchema = z.object({
	id: organizationsTableInsertSchema.shape.id
		.unwrap()
		.nullable()
		.optional()
		.transform((val) => {
			if (val == null) throw new Error("id is required");
			return val;
		}),
});

export const QueryOrganizationInput = builder
	.inputRef<z.infer<typeof queryOrganizationInputSchema>>(
		"QueryOrganizationInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the organization.",
				required: true,
			}),
		}),
	});
