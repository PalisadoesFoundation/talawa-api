import type { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";

export const mutationRequestPasswordResetInputSchema =
	usersTableInsertSchema.pick({
		emailAddress: true,
	});

export const MutationRequestPasswordResetInput = builder
	.inputRef<z.infer<typeof mutationRequestPasswordResetInputSchema>>(
		"MutationRequestPasswordResetInput",
	)
	.implement({
		description: "Input type for requesting a password reset.",
		fields: (t) => ({
			emailAddress: t.field({
				description: "Email address of the user requesting password reset.",
				required: true,
				type: "EmailAddress",
			}),
		}),
	});
