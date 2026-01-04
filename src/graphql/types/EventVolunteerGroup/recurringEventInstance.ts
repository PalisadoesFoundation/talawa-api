import { Event } from "~/src/graphql/types/Event/Event";
import type { GraphQLContext } from "../../context";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";
import { EventVolunteerGroup } from "./EventVolunteerGroup";

export const RecurringEventInstanceResolver = async (
	parent: EventVolunteerGroupType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!parent.recurringEventInstanceId) {
		return null;
	}
	const instance =
		await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.recurringEventInstanceId as string),
		});
	if (!instance) {
		return null;
	}

	const baseEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, instance.baseRecurringEventId),
	});

	if (!baseEvent) {
		return null;
	}

	return { ...baseEvent, ...instance, attachments: [] };
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		recurringEventInstance: t.field({
			type: Event,
			description:
				"The recurring event instance associated with this volunteer group.",
			nullable: true,
			resolve: RecurringEventInstanceResolver,
		}),
	}),
});
