import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
function isValidAttachment(
	a: unknown,
): a is typeof eventAttachmentsTable.$inferSelect {
	return (
		typeof a === "object" &&
		a !== null &&
		typeof (a as { name?: unknown }).name === "string" &&
		typeof (a as { mimeType?: unknown }).mimeType === "string" &&
		typeof (a as { eventId?: unknown }).eventId === "string"
	);
}
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteerGroup } from "../EventVolunteerGroup/EventVolunteerGroup";
import type { EventVolunteerGroup as VolunteerGroupsType } from "../EventVolunteerGroup/EventVolunteerGroup";

export const resolveEvent = async (
	parent: VolunteerGroupsType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			// Ensure 'capacity' is included in all event object usages and definitions below.
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const event = await ctx.drizzleClient.query.eventsTable.findFirst({
		with: {
			attachmentsWhereEvent: true,
		},
		where: (fields, operators) => operators.eq(fields.id, parent.eventId),
	});

	if (event === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["input", "eventId"],
					},
				],
			},
		});
	}

	return {
		...event,
		capacity: 100,
		attachments: Array.isArray(event.attachmentsWhereEvent)
			? event.attachmentsWhereEvent.filter(isValidAttachment)
			: [],
	};
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		event: t.field({
			description: "Event for which Group was made.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveEvent,
			type: Event,
		}),
	}),
});
