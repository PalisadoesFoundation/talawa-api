import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "./User";

User.implement({
	fields: (t) => ({
		orgIdWhereMembershipRequested: t.field({
			type: ["String"],
			nullable: false,
			description: "The organization ID where the user requested membership.",
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
					currentUserId !== parent.id
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				const membershipRequests =
					await ctx.drizzleClient.query.membershipRequestsTable.findMany({
						columns: { organizationId: true },
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.userId, parent.id),
								operators.eq(fields.status, "pending"),
							),
					});
				const ids = Array.from(
					new Set(membershipRequests.map((r) => r.organizationId)),
				);
				return ids;
			},
		}),
	}),
});
