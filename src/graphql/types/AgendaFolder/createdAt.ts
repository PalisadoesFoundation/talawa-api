import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaFolder } from "./AgendaFolder";

export const resolveCreatedAt = async (
	parent: { eventId: string; createdAt: Date },
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const [currentUser, existingEvent] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.eventsTable.findFirst({
			columns: {
				startAt: true,
			},
			where: (fields, operators) => operators.eq(fields.id, parent.eventId),
			with: {
				organization: {
					columns: {
						countryCode: true,
					},
					with: {
						membershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
				},
			},
		}),
	]);

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Event id existing but the associated event not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingEvent === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	const currentUserOrganizationMembership =
		existingEvent.organization.membershipsWhereOrganization[0];

	if (currentUser.role !== "administrator") {
		if (currentUserOrganizationMembership === undefined) {
			// User is neither a admin nor a member of the organization
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		// User is a member, but membership role is insufficient for this action
		if (currentUserOrganizationMembership.role !== "administrator") {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}
	}

	return parent.createdAt;
};

AgendaFolder.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the agenda folder was created.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveCreatedAt,
			type: "DateTime",
		}),
	}),
});
