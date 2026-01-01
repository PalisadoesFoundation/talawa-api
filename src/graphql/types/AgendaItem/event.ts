import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		event: t.field({
			description:
				"Event for which the agenda item constituting a part of the agenda.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				const existingEvent =
					await ctx.drizzleClient.query.eventsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.eventId),
						with: {
							attachmentsWhereEvent: true,
						},
					});

				// Event id existing but the associated event not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
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

				return Object.assign(existingEvent, {
					attachments: existingEvent.attachmentsWhereEvent,
				});
			},
			type: Event,
		}),
	}),
});
