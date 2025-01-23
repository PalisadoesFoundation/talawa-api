import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";

export const querySignInInputSchema = usersTableInsertSchema
	.pick({
		emailAddress: true,
	})
	.extend({
		password: z.string().min(1).max(64),
	});

export const QuerySignInInput = builder
	.inputRef<z.infer<typeof querySignInInputSchema>>("QuerySignInInput")
	.implement({
		description: "",
		fields: (t) => ({
			emailAddress: t.string({
				description: "Email address of the user.",
				required: true,
			}),
			password: t.string({
				description: "Password of the user to sign in to talawa.",
				required: true,
			}),
		}),
	});
