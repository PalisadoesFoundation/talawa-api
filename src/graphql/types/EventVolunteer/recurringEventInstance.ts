import { Event } from "~/src/graphql/types/Event/Event";
import { EventVolunteer } from "./EventVolunteer";

EventVolunteer.implement({
	fields: (t) => ({
		recurringEventInstance: t.field({
			type: Event,
			description:
				"The recurring event instance associated with this volunteer.",
			nullable: true,
			resolve: async (parent, _args, ctx) => {
				if (!parent.recurringEventInstanceId) {
					return null;
				}
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: (fields, operators) =>
							operators.eq(
								fields.id,
								parent.recurringEventInstanceId as string,
							),
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
			},
		}),
	}),
});
