import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationResetPasswordInputSchema = z.object({
	token: z.string().min(1, "Token is required").max(128),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(64, "Password must not exceed 64 characters"),
});

export const MutationResetPasswordInput = builder
	.inputRef<z.infer<typeof mutationResetPasswordInputSchema>>(
		"MutationResetPasswordInput",
	)
	.implement({
		description: "Input type for resetting password with a valid token.",
		fields: (t) => ({
			token: t.string({
				description: "The password reset token.",
				required: true,
			}),
			newPassword: t.string({
				description: "The new password to set. Must be 8-64 characters.",
				required: true,
			}),
		}),
	});
