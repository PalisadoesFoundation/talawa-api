import type { GraphQLContext } from "~/src/graphql/context";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

export const resolveEvent = async (
	parent: { eventId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Event | null> => {
	// Null guard: if no eventId, return null
	if (!parent.eventId) {
		return null;
	}

	// Fetch the event with its attachments
	const existingEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.eventId as string),
		with: {
			attachmentsWhereEvent: true,
		},
	});

	// If not found, log error and throw unexpected
	if (!existingEvent) {
		ctx.log.error(
			"Postgres select operation returned no row for action item's eventId that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	// Map attachments relationship to the 'attachments' field on the Event type
	return Object.assign(existingEvent, {
		attachments: existingEvent.attachmentsWhereEvent,
	});
};

ActionItem.implement({
	fields: (t) => ({
		event: t.field({
			type: Event,
			nullable: true,
			description:
				"Fetch the event associated with this action item, including attachments if available.",
			resolve: resolveEvent,
		}),
	}),
});
