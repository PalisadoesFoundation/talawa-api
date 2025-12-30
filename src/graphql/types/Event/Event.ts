import type { eventsTable } from "~/src/drizzle/tables/events";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	EventAttachment,
	type EventAttachment as EventAttachmentType,
} from "~/src/graphql/types/EventAttachment/EventAttachment";
import { RecurrenceRule } from "~/src/graphql/types/RecurrenceRule/RecurrenceRule";
import { formatRecurrenceDescription } from "~/src/utilities/recurrenceFormatter";
import { escapeHTML } from "~/src/utilities/sanitizer";

// Unified Event type supporting both standalone events and materialized instances
export type Event =
	| (typeof eventsTable.$inferSelect & { attachments: EventAttachmentType[] })
	| (ResolvedRecurringEventInstance & {
			attachments: EventAttachmentType[];
	  });

export const Event = builder.objectRef<Event>("Event");

Event.implement({
	description:
		"Represents an event, which can be a standalone occurrence or a materialized instance of a recurring series. This unified type allows for consistent handling of all events.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description:
				"A list of attachments associated with the event, such as images or documents.",
			type: t.listRef(EventAttachment),
		}),
		description: t.string({
			description:
				"A detailed description of the event, providing custom information and context.",
			nullable: true,
			resolve: (event) =>
				event.description ? escapeHTML(event.description) : null,
		}),
		endAt: t.field({
			description:
				"The date and time when the event is scheduled to end. For materialized instances, this reflects the actual end time if modified.",
			type: "DateTime",
			resolve: (event) =>
				"actualEndTime" in event ? event.actualEndTime : event.endAt,
		}),
		id: t.exposeID("id", {
			description:
				"The unique global identifier for the event. For recurring instances, this ID refers to the specific materialized instance.",
			nullable: false,
		}),
		name: t.string({
			description: "The name or title of the event.",
			resolve: (event) => escapeHTML(event.name),
		}),
		startAt: t.field({
			description:
				"The date and time when the event is scheduled to start. For materialized instances, this reflects the actual start time if modified.",
			type: "DateTime",
			nullable: false,
			resolve: (event) =>
				"actualStartTime" in event ? event.actualStartTime : event.startAt,
		}),
		allDay: t.exposeBoolean("allDay", {
			description:
				"A boolean flag indicating if the event lasts for the entire day.",
		}),
		isInviteOnly: t.exposeBoolean("isInviteOnly", {
			description: "A boolean flag indicating if the event is invite-only.",
		}),
		isPublic: t.exposeBoolean("isPublic", {
			description:
				"A boolean flag indicating if the event is visible to the public.",
		}),
		isRegisterable: t.exposeBoolean("isRegisterable", {
			description:
				"A boolean flag indicating if users can register for this event.",
		}),
		location: t.exposeString("location", {
			description:
				"The physical or virtual location where the event will take place.",
		}),
		isRecurringEventTemplate: t.boolean({
			description:
				"A boolean flag indicating if this event serves as a template for a recurring series.",
			resolve: (event) =>
				"isRecurringEventTemplate" in event && event.isRecurringEventTemplate,
		}),
		baseEvent: t.field({
			description:
				"The base event from which this materialized instance was generated.",
			type: Event,
			nullable: true,
			resolve: async (event, _args, { drizzleClient }) => {
				const baseRecurringEventId =
					"baseRecurringEventId" in event ? event.baseRecurringEventId : null;
				if (baseRecurringEventId) {
					const baseEvent = await drizzleClient.query.eventsTable.findFirst({
						where: (fields, { eq }) => eq(fields.id, baseRecurringEventId),
					});
					if (baseEvent) {
						return { ...baseEvent, attachments: [] };
					}
				}
				return null;
			},
		}),
		hasExceptions: t.boolean({
			description:
				"A boolean flag indicating if this materialized instance has any exceptions applied to it.",
			resolve: (event) => "hasExceptions" in event && event.hasExceptions,
		}),
		sequenceNumber: t.int({
			description:
				"The sequence number of this instance within its recurring series (e.g., 1, 2, 3, ...).",
			resolve: (event) =>
				"sequenceNumber" in event ? event.sequenceNumber : null,
		}),
		totalCount: t.int({
			description:
				"The total number of instances in the complete recurring series. This will be null for infinite series.",
			resolve: (event) => ("totalCount" in event ? event.totalCount : null),
		}),
		progressLabel: t.string({
			description:
				"A human-readable label indicating the progress of this instance in the series, such as '5 of 12' or 'Episode #7'.",
			resolve: (event) => {
				if ("sequenceNumber" in event && "totalCount" in event) {
					const sequence = event.sequenceNumber;
					const total = event.totalCount;
					if (total) {
						return escapeHTML(`${sequence} of ${total}`);
					}
					return escapeHTML(`#${sequence}`);
				}
				return null;
			},
		}),
		recurrenceRule: t.field({
			description: "The recurrence rule object for recurring events.",
			type: RecurrenceRule,
			nullable: true,
			resolve: async (event, _args, { drizzleClient }) => {
				let recurrenceRule = null;

				// Case 1: Recurring event instance (has recurrenceRuleId field)
				if ("recurrenceRuleId" in event && event.recurrenceRuleId) {
					recurrenceRule =
						await drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, { eq }) => eq(fields.id, event.recurrenceRuleId),
						});
				}
				// Case 2: Recurring event instance (has baseRecurringEventId field)
				else if (
					"baseRecurringEventId" in event &&
					event.baseRecurringEventId
				) {
					recurrenceRule =
						await drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, { eq }) =>
								eq(fields.baseRecurringEventId, event.baseRecurringEventId),
						});
				}
				// Case 3: Recurring event template (look up by this event's ID as baseRecurringEventId)
				else if (
					"isRecurringEventTemplate" in event &&
					event.isRecurringEventTemplate
				) {
					recurrenceRule =
						await drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, { eq }) =>
								eq(fields.baseRecurringEventId, event.id),
						});
				}

				return recurrenceRule;
			},
		}),
		recurrenceDescription: t.string({
			description:
				"A human-readable description of the recurrence pattern, such as 'Daily', 'Weekly on Monday', 'Monthly on the 15th', etc. Available for recurring event templates and instances.",
			nullable: true,
			resolve: async (event, _args, { drizzleClient }) => {
				let recurrenceRule = null;

				// Case 1: Recurring event instance (has recurrenceRuleId field)
				if ("recurrenceRuleId" in event && event.recurrenceRuleId) {
					recurrenceRule =
						await drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, { eq }) => eq(fields.id, event.recurrenceRuleId),
						});
				}
				// Case 2: Recurring event instance (has baseRecurringEventId field)
				else if (
					"baseRecurringEventId" in event &&
					event.baseRecurringEventId
				) {
					recurrenceRule =
						await drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, { eq }) =>
								eq(fields.baseRecurringEventId, event.baseRecurringEventId),
						});
				}
				// Case 3: Recurring event template (look up by this event's ID as baseRecurringEventId)
				else if (
					"isRecurringEventTemplate" in event &&
					event.isRecurringEventTemplate
				) {
					recurrenceRule =
						await drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, { eq }) =>
								eq(fields.baseRecurringEventId, event.id),
						});
				}

				if (!recurrenceRule) {
					return null;
				}

				return escapeHTML(formatRecurrenceDescription(recurrenceRule));
			},
		}),
	}),
});
