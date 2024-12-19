import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { Chat } from "./Chat";

Chat.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the chat was created.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					with: {
						chatMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.chatId, parent.id),
						},
						organizationMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.organizationId, parent.organizationId),
						},
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				const currentUserOrganizationMembership =
					currentUser.organizationMembershipsWhereMember[0];
				const currentUserChatMembership =
					currentUser.chatMembershipsWhereMember[0];

				if (
					currentUser.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						(currentUserOrganizationMembership.role !== "administrator" &&
							(currentUserChatMembership === undefined ||
								currentUserChatMembership.role !== "administrator")))
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
						message: "You are not authorized to perform this action.",
					});
				}

				return parent.createdAt;
			},
			type: "DateTime",
		}),
	}),
});
