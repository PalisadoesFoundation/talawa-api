import type { actionsTable } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";

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
		// Removed raw ID fields - these will be replaced with relationship resolvers
		// organizationId, categoryId, eventId, assigneeId, creatorId, updaterId
	}),
});
