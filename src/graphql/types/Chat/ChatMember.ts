import type { z } from "zod";
import { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import { builder } from "~/src/graphql/builder";
import { ChatMembershipRole } from "~/src/graphql/enums/ChatMembershipRole";
import type { User } from "~/src/graphql/types/User/User";
import { User as UserRef } from "~/src/graphql/types/User/User";

export type ChatMemberRole = z.infer<typeof chatMembershipRoleEnum>;

export interface ChatMemberType {
	member: User;
	role: ChatMemberRole;
}

export const ChatMember = builder.objectRef<ChatMemberType>("ChatMember");

ChatMember.implement({
	description: "A member of a chat with their role.",
	fields: (t) => ({
		user: t.field({
			description: "The user who is a member of the chat.",
			resolve: (parent) => parent.member,
			type: UserRef,
		}),
		role: t.field({
			description: "The role of the user in the chat.",
			resolve: (parent) => parent.role,
			type: ChatMembershipRole,
		}),
	}),
});
