import type { chatsTable } from "~/src/drizzle/tables/chats";
import envConfig from "~/src/utilities/graphqLimits";
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
			message: "You must be authenticated to perform this action.",
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Check if the current user exists
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Allow administrators to access all chat updatedAt fields
	if (currentUser.role === "administrator") {
		return parent.updatedAt;
	}

	// Allow the creator of the chat to access updatedAt field
	if (parent.creatorId === currentUserId) {
		return parent.updatedAt;
	}

	// Check if the user is a member of this chat
	const chatMembership =
		await ctx.drizzleClient.query.chatMembershipsTable.findFirst({
			columns: {
				chatId: true,
			},
			where: (fields, operators) =>
				operators.and(
					operators.eq(fields.chatId, parent.id),
					operators.eq(fields.memberId, currentUserId),
				),
		});

	if (chatMembership === undefined) {
		throw new TalawaGraphQLError({
			message:
				"You must be a member of this chat to access timestamp information.",
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.updatedAt;
};

Chat.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the chat was last updated.",
			resolve: resolveUpdatedAt,
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			type: "DateTime",
		}),
	}),
});
