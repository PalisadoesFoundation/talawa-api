// ActionItemCategoryCreatorResolver.ts

import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "./ActionItemCategory";

ActionItemCategory.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the action item category.",
			type: User,
			resolve: async (parent, _args, ctx) => {
				// Ensure the current client is authenticated.
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				// Fetch the current user along with their organization memberships for authorization.
				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					with: {
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

				// If no current user is found, throw an unauthenticated error.
				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserOrganizationMembership =
					currentUser.organizationMembershipsWhereMember[0];

				// Check whether the current user or their membership holds administrator privileges.
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

				// If creatorId is null, then return null.
				if (parent.creatorId === null) {
					return null;
				}

				// If the current user is the creator, return the current user.
				if (parent.creatorId === currentUserId) {
					return currentUser;
				}

				const creatorId = parent.creatorId;

				// Query the usersTable for the creator using the creatorId.
				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, creatorId),
				});

				// If no user is found for the creatorId, log an error and throw an exception.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an action item category's creator id that isn't null."
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Return the fetched creator.
				return existingUser;
			},
		}),
	}),
});
