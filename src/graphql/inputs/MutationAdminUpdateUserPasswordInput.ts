import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";

/**
 * Schema for updating a users password by admin.
 */
export const mutationAdminUpdateUserPasswordInputSchema = z.object({
	id: usersTableInsertSchema.shape.id.unwrap(),
	newPassword: z.string().min(8).max(64),
	confirmNewPassword: z.string().min(8).max(64),
});

export const MutationAdminUpdateUserPasswordInput = builder
	.inputRef<z.infer<typeof mutationAdminUpdateUserPasswordInputSchema>>(
		"MutationAdminUpdateUserPasswordInput",
	)
	.implement({
		description: "Input for updating a member's password.",
		fields: (t) => ({
			id: t.id({
				required: true,
				description: "ID of the member whose password is being updated.",
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
