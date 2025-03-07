import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/schema";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import type { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Chat } from "./Chat";

type ChatsTable = typeof chatsTable.$inferSelect;

export const resolveUpdater = async (
	parent: ChatsTable,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		with: {
			chatMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: eq(chatMembershipsTable.chatId, parent.id),
			},
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: eq(
					organizationMembershipsTable.organizationId,
					parent.organizationId,
				),
			},
		},
		where: eq(usersTable.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];
	const currentUserChatMembership = currentUser.chatMembershipsWhereMember[0];

	const isGlobalAdmin = currentUser.role === "administrator";
	const isOrgAdmin =
		currentUserOrganizationMembership?.role === "administrator";
	const isChatAdmin = currentUserChatMembership?.role === "administrator";

	if (!isGlobalAdmin && !isOrgAdmin && !isChatAdmin) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	if (parent.updaterId === null) {
		return null;
	}

	if (parent.updaterId === currentUserId) {
		return currentUser;
	}

	const updaterId = parent.updaterId;

	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, updaterId),
	});

	// Updater id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingUser === undefined) {
		const errorMessage = `Updater with ID ${updaterId} not found despite being referenced in chat ${parent.id}`;
		ctx.log.error(errorMessage);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
				message: errorMessage,
			},
		});
	}

	return existingUser;
};

Chat.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the chat.",
			resolve: resolveUpdater,
			type: User,
		}),
	}),
});
