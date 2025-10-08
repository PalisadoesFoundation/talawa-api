import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
type MaybeAttachment = Partial<
	Pick<
		typeof eventAttachmentsTable.$inferSelect,
		"name" | "mimeType" | "eventId"
	>
> &
	Record<string, unknown>;
function isValidAttachment(
	a: MaybeAttachment,
): a is typeof eventAttachmentsTable.$inferSelect {
	return (
		!!a &&
		typeof a.name === "string" &&
		typeof a.mimeType === "string" &&
		typeof a.eventId === "string"
	);
}
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

				return {
					...existingEvent,
					capacity: 100,
					attachments: Array.isArray(existingEvent.attachmentsWhereEvent)
						? existingEvent.attachmentsWhereEvent.filter(isValidAttachment)
						: [],
				};
			},
		}),
	}),
});
