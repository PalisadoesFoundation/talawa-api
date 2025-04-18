import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { ActionItem } from "./ActionItem";

ActionItem.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the action item.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			type: User,
			resolve: async (parent, _args, ctx) => {
				// Check if the current client is authenticated.
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				// Fetch the current user along with their organization memberships.
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

				// Check if the current user has administrator privileges.
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

				// If the updaterId is null, return null.
				if (parent.updaterId === null) {
					return null;
				}

				// If the current user is the updater, return the currentUser.
				if (parent.updaterId === currentUserId) {
					return currentUser;
				}

				const updaterId = parent.updaterId;

				// Query the usersTable to fetch the updater based on updaterId.
				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, updaterId),
					},
				);

				// Log and throw an error if no user is found for the given updaterId.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an action item's updater id that isn't null.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingUser;
			},
		}),
	}),
});
