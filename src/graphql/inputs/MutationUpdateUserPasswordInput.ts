import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Schema for updating current user's password
 */
export const mutationUpdateUserPasswordInputSchema = z.object({
	oldPassword: z.string().min(1).max(64),
	newPassword: z.string().min(8).max(64),
	confirmNewPassword: z.string().min(8).max(64),
});

export const MutationUpdateUserPasswordInput = builder
	.inputRef<z.infer<typeof mutationUpdateUserPasswordInputSchema>>(
		"MutationUpdateUserPasswordInput",
	)
	.implement({
		description: "Input for updating the current user's password.",
		fields: (t) => ({
			oldPassword: t.string({
				required: true,
				description: "User's current password",
			}),
			newPassword: t.string({
				required: true,
				description: "New password",
			}),
			confirmNewPassword: t.string({
				required: true,
				description: "Confirm new password",
			}),
		}),
	});
