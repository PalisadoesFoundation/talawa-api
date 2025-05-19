import type { z } from "zod";
import { chatMembershipsTableInsertSchema } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";
import { ChatMembershipRole } from "~/src/graphql/enums/ChatMembershipRole";

export const mutationCreateChatMembershipInputSchema =
	chatMembershipsTableInsertSchema
		.pick({
			chatId: true,
			memberId: true,
		})
		.extend({
			role: chatMembershipsTableInsertSchema.shape.role.optional(),
		});

export const MutationCreateChatMembershipInput = builder
	.inputRef<z.infer<typeof mutationCreateChatMembershipInputSchema>>(
		"MutationCreateChatMembershipInput",
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
				type: ChatMembershipRole,
			}),
		}),
	});
