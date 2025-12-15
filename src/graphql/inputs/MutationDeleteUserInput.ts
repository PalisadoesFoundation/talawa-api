import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteUserInputSchema = z.object({
	id: usersTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteUserInput = builder
	.inputRef<z.infer<typeof mutationDeleteUserInputSchema>>(
		"MutationDeleteUserInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the user.",
				required: true,
			}),
		}),
	});
