import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/schema";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import type { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Chat } from "./Chat";
type ChatsTable = typeof chatsTable.$inferSelect;

export const resolveUpdatedAt = async (
	parent: ChatsTable,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: { role: true },
		with: {
			chatMembershipsWhereMember: {
				columns: { role: true },
				where: eq(chatMembershipsTable.chatId, parent.id),
			},
			organizationMembershipsWhereMember: {
				columns: { role: true },
				where: eq(
					organizationMembershipsTable.organizationId,
					parent.organizationId,
				),
			},
		},
		where: eq(usersTable.id, currentUserId),
	});

	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];
	const currentUserChatMembership = currentUser.chatMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		(!currentUserOrganizationMembership ||
			(currentUserOrganizationMembership.role !== "administrator" &&
				(!currentUserChatMembership ||
					currentUserChatMembership.role !== "administrator")))
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	return parent.updatedAt;
};

Chat.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the chat was last updated.",
			resolve: resolveUpdatedAt,
			type: "DateTime",
		}),
	}),
});
