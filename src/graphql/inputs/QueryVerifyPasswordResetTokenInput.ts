import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const queryVerifyPasswordResetTokenInputSchema = z.object({
	token: z.string().min(1, "Token is required").max(128),
});

export const QueryVerifyPasswordResetTokenInput = builder
	.inputRef<z.infer<typeof queryVerifyPasswordResetTokenInputSchema>>(
		"QueryVerifyPasswordResetTokenInput",
	)
	.implement({
		description: "Input type for verifying a password reset token.",
		fields: (t) => ({
			token: t.string({
				description: "The password reset token to verify.",
				required: true,
			}),
		}),
	});
