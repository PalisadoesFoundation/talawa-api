import type { actionsTable } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";

export type ActionItem = typeof actionsTable.$inferSelect;

export const ActionItem = builder.objectRef<ActionItem>("ActionItem");

ActionItem.implement({
	description:
		"Represents an action item assigned to users, linked to events, categories, and organizations.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Unique identifier for the action item.",
		}),
		isCompleted: t.exposeBoolean("isCompleted", {
			description: "Indicates whether the action item is completed.",
		}),
		assignedAt: t.expose("assignedAt", {
			description: "Timestamp when the action item was assigned.",
			type: "DateTime",
		}),
		completionAt: t.expose("completionAt", {
			description: "Timestamp when the action item was completed.",
			type: "DateTime",
			nullable: true,
		}),
		preCompletionNotes: t.exposeString("preCompletionNotes", {
			description: "Notes added before completing the action item.",
			nullable: true,
		}),
		postCompletionNotes: t.exposeString("postCompletionNotes", {
			description: "Notes added after completing the action item.",
			nullable: true,
		}),
		recurringEventInstanceId: t.exposeString("recurringEventInstanceId", {
			description: "The ID of the recurring event instance.",
			nullable: true,
		}),
		recurringEventInstance: t.field({
			type: Event,
			description:
				"The recurring event instance associated with this action item.",
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
