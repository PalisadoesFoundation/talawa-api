import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";

export const queryUserInputSchema = z.object({
	id: usersTableInsertSchema.shape.id.unwrap(),
});

export const QueryUserInput = builder
	.inputRef<z.infer<typeof queryUserInputSchema>>("QueryUserInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the user.",
				required: true,
			}),
		}),
	});
