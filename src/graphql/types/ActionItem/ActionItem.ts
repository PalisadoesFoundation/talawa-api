import type { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";

export type ActionItem = typeof actionItemsTable.$inferSelect & {
	isInstanceException?: boolean;
};

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
		isTemplate: t.exposeBoolean("isTemplate", {
			description:
				"Indicates whether the action item is a template for recurring events.",
			nullable: true,
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
		isInstanceException: t.field({
			type: "Boolean",
			description:
				"Indicates whether this action item is currently showing instance-specific exception data.",
			resolve: (parent) => {
				// This field will be set by the resolver when exceptions are applied
				return Boolean(
					(parent as { isInstanceException?: boolean }).isInstanceException,
				);
			},
		}),
	}),
});
