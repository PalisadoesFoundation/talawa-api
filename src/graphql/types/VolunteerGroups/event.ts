import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { VolunteerGroups } from "./VolunteerGroups";

VolunteerGroups.implement({
	fields: (t) => ({
		event: t.field({
			description: "Event for which Group was made.",
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
					with: {
						attachmentsWhereEvent: true,
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

				return Object.assign(event, {
					attachments: event.attachmentsWhereEvent,
				});
			},
			type: Event,
		}),
	}),
});
