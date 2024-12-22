import { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import { builder } from "~/src/graphql/builder";

export const ChatMembershipRole = builder.enumType("ChatMembershipRole", {
	description: "",
	values: chatMembershipRoleEnum.options,
});
