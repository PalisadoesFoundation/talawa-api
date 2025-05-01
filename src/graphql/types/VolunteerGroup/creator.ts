import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { User } from "../User/User";
import { VolunteerGroups } from "./VolunteerGroup";

VolunteerGroups.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who has created the Group.",
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

				const event = await ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {
						organizationId: true,
					},
					where: (fields, operators) => operators.eq(fields.id, parent.eventId), // parent is the VolunteerGroup
				});

				if (!event) {
					throw new Error("Event not found");
				}

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					with: {
						organizationMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.organizationId, event.organizationId),
						},
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

				if (parent.creatorId === null) {
					return null;
				}

				if (parent.creatorId === currentUserId) {
					return currentUser;
				}

				const creatorId = parent.creatorId;

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, creatorId),
					},
				);

				// Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a group's creator id that isn't null.",
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
