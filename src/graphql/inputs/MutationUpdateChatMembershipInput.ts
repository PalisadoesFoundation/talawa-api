import type { z } from "zod";
import { chatMembershipsTableInsertSchema } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";
import { ChatMembershipRole } from "~/src/graphql/enums/ChatMembershipRole";

export const mutationUpdateChatMembershipInputSchema =
	chatMembershipsTableInsertSchema.pick({
		chatId: true,
		memberId: true,
		role: true,
	});

export const MutationUpdateChatMembershipInput = builder
	.inputRef<z.infer<typeof mutationUpdateChatMembershipInputSchema>>(
		"MutationUpdateChatMembershipInput",
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
			role: t.field({
				description: "Role assigned to the user within the chat.",
				required: true,
				type: ChatMembershipRole,
			}),
		}),
	});
