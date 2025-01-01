import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Comment } from "./Comment";

Comment.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the comment.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const [currentUser, existingPost] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.postsTable.findFirst({
						columns: {
							pinnedAt: true,
						},
						with: {
							organization: {
								columns: {
									countryCode: true,
								},
								with: {
									organizationMembershipsWhereOrganization: {
										columns: {
											role: true,
										},
										where: (fields, operators) =>
											operators.eq(fields.memberId, currentUserId),
									},
								},
							},
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parent.postId),
					}),
				]);

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Post id existing but the associated post not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingPost === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a comment's post id that isn't null.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				const currentUserOrganizationMembership =
					existingPost.organization.organizationMembershipsWhereOrganization[0];

				if (
					currentUser.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						currentUserOrganizationMembership.role !== "administrator")
				) {
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

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, updaterId),
					},
				);

				// Updater id existing but the associated user not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a comment's updater id that isn't null.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingUser;
			},
			type: User,
		}),
	}),
});
