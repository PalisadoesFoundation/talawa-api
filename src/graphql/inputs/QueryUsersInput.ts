import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const queryUsersInputSchema = z.object({
	limit: z.number().int().positive().optional(),
});

// ✅ Define GraphQL Input Type
export const QueryUsersInput = builder
	.inputRef<z.infer<typeof queryUsersInputSchema>>("QueryUsersInput")
	.implement({
		description: "Input for querying multiple users",
		fields: (t) => ({
			limit: t.int({
				description: "Number of users to return",
				required: false,
			}),
		}),
	});
