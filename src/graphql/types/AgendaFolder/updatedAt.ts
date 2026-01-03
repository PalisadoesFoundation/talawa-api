import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaFolder as AgendaFolderType } from "./AgendaFolder";
import { AgendaFolder } from "./AgendaFolder";

/**
 * Resolver function for the AgendaFolder.updatedAt field.
 * Exported for testing purposes.
 *
 * @param parent - The parent AgendaFolder object
 * @param _args - GraphQL arguments (unused)
 * @param ctx - GraphQL context with authentication and database access
 * @returns - The updatedAt timestamp of the agenda folder
 * @throws TalawaGraphQLError When user is not authenticated or unauthorized
 */
export const resolveUpdatedAt = async (
	parent: AgendaFolderType,
	_args: unknown,
	ctx: GraphQLContext,
): Promise<Date | null> => {
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

	return parent.updatedAt;
};

AgendaFolder.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the agenda folder was last updated.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveUpdatedAt,
			type: "DateTime",
		}),
	}),
});
