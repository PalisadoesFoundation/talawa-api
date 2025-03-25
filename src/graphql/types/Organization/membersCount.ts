import { and, count, eq } from "drizzle-orm";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

// Extends Organization with membersCount and adminsCount and isMember Fields
Organization.implement({
	fields: (t) => ({
		membersCount: t.int({
			description: "Total number of members in the organization.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}
				const result = await ctx.drizzleClient
					.select({
						total: count(),
					})
					.from(organizationMembershipsTable)
					.where(eq(organizationMembershipsTable.organizationId, parent.id))
					.then((res) => res[0]?.total ?? 0);

				return result;
			},
		}),

		adminsCount: t.int({
			description: "Total number of admins in the organization.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}
				const result = await ctx.drizzleClient
					.select({
						total: count(),
					})
					.from(organizationMembershipsTable)
					.where(
						and(
							eq(organizationMembershipsTable.organizationId, parent.id),
							eq(organizationMembershipsTable.role, "administrator"),
						),
					)
					.then((res) => res[0]?.total ?? 0);

				return result;
			},
		}),

		isMember: t.field({
			description:
				"Indicates whether the current user is a member of this organization.",
			type: "Boolean",
			resolve: async (parent, _args, ctx) => {
				// Check authentication
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const membership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						columns: {
							memberId: true,
						},
						where: and(
							eq(organizationMembershipsTable.organizationId, parent.id),
							eq(organizationMembershipsTable.memberId, currentUserId),
						),
					});

				return membership !== undefined;
			},
		}),
	}),
});
