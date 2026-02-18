import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Chat } from "./Chat";

Chat.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the chat was first created.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
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

				// Allow administrators to access all chat createdAt fields
				if (currentUser.role === "administrator") {
					return parent.createdAt;
				}

				// Allow the creator of the chat to access createdAt field
				if (parent.creatorId === currentUserId) {
					return parent.createdAt;
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
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				return parent.createdAt;
			},
			type: "DateTime",
		}),
	}),
});
