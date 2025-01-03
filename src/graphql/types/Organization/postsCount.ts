import { count, eq } from "drizzle-orm";
import { postsTable } from "~/src/drizzle/tables/posts";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

Organization.implement({
	fields: (t) => ({
		postsCount: t.field({
			description: "Total number of posts belonging to the organization.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const [currentUser, [postsCount]] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						with: {
							organizationMembershipsWhereMember: {
								columns: {
									role: true,
								},
								where: (fields, operators) =>
									operators.eq(fields.organizationId, parent.id),
							},
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient
						.select({
							count: count(),
						})
						.from(postsTable)
						.where(eq(postsTable.organizationId, parent.id)),
				]);

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserOrganizationMembership =
					currentUser.organizationMembershipsWhereMember[0];

				if (
					currentUser.role !== "administrator" &&
					currentUserOrganizationMembership === undefined
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				if (postsCount === undefined) {
					return 0;
				}

				return postsCount.count;
			},
			type: "Int",
		}),
	}),
});
