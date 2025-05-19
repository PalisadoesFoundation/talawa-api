import type { z } from "zod";
import { blockedUsersTableInsertSchema } from "~/src/drizzle/tables/blockedUsers";
import { builder } from "~/src/graphql/builder";

export const mutationUnblockUserInputSchema = blockedUsersTableInsertSchema
	.pick({
		userId: true,
		organizationId: true,
	})
	.refine(
		({ userId, organizationId }) =>
			userId !== undefined && organizationId !== undefined,
		{
			message: "Both userId and organizationId must be provided.",
		},
	);

export const MutationUnblockUserInput = builder
	.inputRef<z.infer<typeof mutationUnblockUserInputSchema>>(
		"MutationUnblockUserInput",
	)
	.implement({
		description: "Input to unblock a user from an organization",
		fields: (t) => ({
			userId: t.id({
				description: "Global identifier of the user to unblock.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the organization.",
				required: true,
			}),
		}),
	});
