import type { z } from "zod";
import { chatMembershipsTableInsertSchema } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteChatMembershipInputSchema =
	chatMembershipsTableInsertSchema.pick({
		chatId: true,
		memberId: true,
	});

export const MutationDeleteChatMembershipInput = builder
	.inputRef<z.infer<typeof mutationDeleteChatMembershipInputSchema>>(
		"MutationDeleteChatMembershipInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			chatId: t.id({
				description: "Global identifier of the associated chat.",
				required: true,
			}),
			memberId: t.id({
				description: "Global identifier of the associated user.",
				required: true,
			}),
		}),
	});
