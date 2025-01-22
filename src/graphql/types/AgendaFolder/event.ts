import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaFolder } from "./AgendaFolder";

AgendaFolder.implement({
	fields: (t) => ({
		event: t.field({
			description:
				"Event for which the agenda folder contains agenda items constituting a part of the agenda.",
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
						"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
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
