import type { GraphQLContext } from "~/src/graphql/context";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaItem as AgendaItemType } from "./AgendaItem";
import { AgendaItem } from "./AgendaItem";

// Exported resolver for unit testing
export const resolveEvent = async (
	parent: AgendaItemType,
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
			where: (fields, operators) => operators.eq(fields.id, parent.eventId),
			with: {
				organization: {
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
				attachmentsWhereEvent: true,
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

	if (existingEvent === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda item's event id that isn't null.",
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

	return Object.assign(existingEvent, {
		attachments: existingEvent.attachmentsWhereEvent,
	});
};

AgendaItem.implement({
	fields: (t) => ({
		event: t.field({
			description:
				"Event for which the agenda item constituting a part of the agenda.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveEvent,
			type: Event,
		}),
	}),
});
