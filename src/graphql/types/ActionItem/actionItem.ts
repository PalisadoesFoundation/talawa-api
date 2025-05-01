// Import type from the Drizzle ORM table schema
import type { actionItemsTable } from "~/src/drizzle/tables/actionItems";

// Import the GraphQL builder from Pothos
import { builder } from "~/src/graphql/builder";

// Infer the shape of a selected ActionItem row from the table schema
export type ActionItem = typeof actionItemsTable.$inferSelect;

/**
 * 🔹 Define a GraphQL object type for `ActionItem`
 * - Represents a task assigned to a user, optionally linked to an event, category, or organization.
 */
export const ActionItem = builder.objectRef<ActionItem>("ActionItem");

ActionItem.implement({
	description:
		"Represents an action item assigned to users, linked to events, categories, and organizations.",
	fields: (t) => ({
		// Exposes the primary key ID
		id: t.exposeID("id", {
			description: "Unique identifier for the action item.",
		}),

		// Boolean indicating task completion status
		isCompleted: t.exposeBoolean("isCompleted", {
			description: "Indicates whether the action item is completed.",
		}),

		// Date and time the action item was assigned
		assignedAt: t.expose("assignedAt", {
			description: "Timestamp when the action item was assigned.",
			type: "DateTime",
		}),

		// Date and time the action item was last updated (nullable)
		updatedAt: t.expose("updatedAt", {
			description: "Timestamp when the action item was last updated.",
			type: "DateTime",
			nullable: true,
		}),

		// Completion timestamp (if the task was completed)
		completionAt: t.expose("completionAt", {
			description: "Timestamp when the action item was completed.",
			type: "DateTime",
		}),

		// Optional notes added before completing the action
		preCompletionNotes: t.exposeString("preCompletionNotes", {
			description: "Notes added before completing the action item.",
			nullable: true,
		}),

		// Optional notes added after completing the action
		postCompletionNotes: t.exposeString("postCompletionNotes", {
			description: "Notes added after completing the action item.",
			nullable: true,
		}),

		/**
		 * Custom field: allottedHours
		 * - Converts numeric or string input to a float
		 * - Handles edge cases where the value may be invalid or null
		 */
		allottedHours: t.field({
			type: "Float",
			nullable: true,
			description: "Number of hours allotted to complete the action item.",
			resolve(parent) {
				const raw = parent.allottedHours;

				// If the value is a string, attempt to parse it as a float
				if (typeof raw === "string") {
					const parsed = Number.parseFloat(raw);
					return Number.isNaN(parsed) ? null : parsed;
				}

				// If the value is a number, return it only if it's not NaN
				if (typeof raw === "number") {
					return Number.isNaN(raw) ? null : raw;
				}

				// Return null if value is neither string nor number
				return null;
			},
		}),
	}),
});
