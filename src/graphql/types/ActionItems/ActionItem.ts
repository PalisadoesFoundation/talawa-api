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
		}),
		createdAt: t.expose("createdAt", {
			description: "Timestamp when the action item was created.",
			type: "DateTime",
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Timestamp when the action item was last updated.",
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
		organizationId: t.exposeID("organizationId", {
			description: "The ID of the organization the action item belongs to.",
		}),
		categoryId: t.exposeID("categoryId", {
			description: "The ID of the category this action item belongs to.",
			nullable: true,
		}),
		eventId: t.exposeID("eventId", {
			description: "The ID of the associated event, if applicable.",
			nullable: true,
		}),
		assigneeId: t.exposeID("assigneeId", {
			description: "The ID of the user assigned to this action item.",
			nullable: true,
		}),
		creatorId: t.exposeID("creatorId", {
			description: "The ID of the user who created this action item.",
			nullable: true,
		}),
		updaterId: t.exposeID("updaterId", {
			description: "The ID of the user who last updated this action item.",
			nullable: true,
		}),
	}),
});
