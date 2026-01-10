import type { GraphQLContext } from "~/src/graphql/context";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaCategory as AgendaCategoryType } from "./AgendaCategories";
import { AgendaCategory } from "./AgendaCategories";

// Exported resolver for unit testing
export const resolveEvent = async (
	parent: AgendaCategoryType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const [currentUser, existingEvent] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			columns: { role: true },
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.eventsTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, parent.eventId),
			with: {
				attachmentsWhereEvent: true,
				organization: {
					with: {
						membershipsWhereOrganization: {
							columns: { role: true },
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
				},
			},
		}),
	]);

	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	if (!existingEvent) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda category event id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	const membership = existingEvent.organization.membershipsWhereOrganization[0];

	if (
		currentUser.role !== "administrator" &&
		(!membership || membership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	return Object.assign(existingEvent, {
		attachments: existingEvent.attachmentsWhereEvent,
	});
};

AgendaCategory.implement({
	fields: (t) => ({
		event: t.field({
			description:
				"Event for which the agenda category constitutes a part of the agenda.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			type: Event,
			resolve: resolveEvent,
		}),
	}),
});
