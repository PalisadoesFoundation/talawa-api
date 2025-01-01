import { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import { builder } from "~/src/graphql/builder";

export const ChatMembershipRole = builder.enumType("ChatMembershipRole", {
	description:
		"Possible variants of the role assigned to a user within a chat.",
	values: chatMembershipRoleEnum.options,
});
