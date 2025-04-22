import type { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";

export type ActionItem = typeof actionItemsTable.$inferSelect;

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
		updatedAt: t.expose("updatedAt", {
			description: "Timestamp when the action item was last updated.",
			type: "DateTime",
			nullable: true,
		}),
		completionAt: t.expose("completionAt", {
			description: "Timestamp when the action item was completed.",
			type: "DateTime",
		}),
		preCompletionNotes: t.exposeString("preCompletionNotes", {
			description: "Notes added before completing the action item.",
			nullable: true,
		}),
		postCompletionNotes: t.exposeString("postCompletionNotes", {
			description: "Notes added after completing the action item.",
			nullable: true,
		}),
		allottedHours: t.field({
			type: "Float",
			nullable: true,
			description: "Number of hours allotted to complete the action item.",
			resolve(parent) {
				const raw = parent.allottedHours;
				// if it's a string (e.g. coming from a numeric column),
				// try to parse it:
				if (typeof raw === "string") {
					const parsed = Number.parseFloat(raw);
					return Number.isNaN(parsed) ? null : parsed;
				}
				// if it's already a number, guard against NaN:
				if (typeof raw === "number") {
					return Number.isNaN(raw) ? null : raw;
				}
				// otherwise, just return null:
				return null;
			},
		}),
	}),
});
