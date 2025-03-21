import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

ActionItem.implement({
	fields: (t) => ({
		event: t.field({
			description:
				"Fetch the event associated with this action item, including attachments if available.",
			type: Event,
			nullable: true,
			resolve: async (parent, _args, ctx) => {
				if (!parent.eventId) return null;

				const existingEvent =
					await ctx.drizzleClient.query.eventsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.eventId as string),
						with: {
							attachmentsWhereEvent: true,
						},
					});

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

				return Object.assign(existingEvent, {
					attachments: existingEvent.attachmentsWhereEvent,
				});
			},
		}),
	}),
});