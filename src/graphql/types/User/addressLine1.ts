import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "./User";

User.implement({
	fields: (t) => ({
		addressLine1: t.field({
			description: "Address line 1 of the user's address.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

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

				if (
					currentUser.role !== "administrator" &&
					parent.id !== currentUserId
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				return parent.addressLine1;
			},
			type: "String",
		}),
	}),
});
