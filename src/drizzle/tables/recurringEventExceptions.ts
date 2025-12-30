import { relations, sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { organizationsTable } from "./organizations";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

/**
 * Drizzle ORM postgres table definition for recurring event exceptions.
 * This table stores instance-specific modifications to recurring events.
 * When a user modifies a single instance or "this and future" instances,
 * the changes are stored here as differences from the template.
 *
 * Clean design principles:
 * - Direct reference to recurring_event_instances.id for precise targeting
 * - JSON-based exception data for flexible field modifications
 * - Template reference can be derived via instance.baseRecurringEventId (no redundant storage)
 * - All exceptions are single-instance modifications (no type differentiation needed)
 */
export const eventExceptionsTable = pgTable(
	"event_exceptions",
	{
		/**
		 * Primary unique identifier of the exception.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the specific recurring event instance.
		 * This directly identifies which instance this exception modifies.
		 * Primary identifier for precise exception targeting.
		 */
		recurringEventInstanceId: uuid("recurring_event_instance_id")
			.notNull()
			.references(() => recurringEventInstancesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * JSON object storing the field differences from the template.
		 * Only stores fields that are different from the base event.
		 * Example: \\{ "name": "Special Meeting", "startAt": "2024-01-15T15:00:00Z" \\}
		 */
		exceptionData: jsonb("exception_data").notNull(),

		/**
		 * Foreign key reference to organization for data isolation.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who created the exception.
		 */
		creatorId: uuid("creator_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "set null",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who last updated the exception.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Date time at the time the exception was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the exception was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
	},
	(self) => ({
		// Primary indexes for optimal performance
		recurringEventInstanceIdIdx: index("ee_recurring_event_instance_id_idx").on(
			self.recurringEventInstanceId,
		),
		organizationIdIdx: index("ee_organization_id_idx").on(self.organizationId),
		creatorIdIdx: index("ee_creator_id_idx").on(self.creatorId),
	}),
);

export const eventExceptionsTableRelations = relations(
	eventExceptionsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from event_exceptions to recurring_event_instances table.
		 * This is the primary relationship for identifying which instance is modified.
		 */
		recurringEventInstance: one(recurringEventInstancesTable, {
			fields: [eventExceptionsTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
			relationName:
				"event_exceptions.recurring_event_instance_id:recurring_event_instances.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to organizations table.
		 */
		organization: one(organizationsTable, {
			fields: [eventExceptionsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "event_exceptions.organization_id:organizations.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to users table (creator).
		 */
		creator: one(usersTable, {
			fields: [eventExceptionsTable.creatorId],
			references: [usersTable.id],
			relationName: "event_exceptions.creator_id:users.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to users table (updater).
		 */
		updater: one(usersTable, {
			fields: [eventExceptionsTable.updaterId],
			references: [usersTable.id],
			relationName: "event_exceptions.updater_id:users.id",
		}),
	}),
);

export const recurringEventExceptionsTableInsertSchema = createInsertSchema(
	eventExceptionsTable,
	{
		exceptionData: z.record(z.any()), // JSON object with any structure
		recurringEventInstanceId: z.string().uuid(),
		organizationId: z.string().uuid(),
		creatorId: z.string().uuid(),
		updaterId: z.string().uuid().optional(),
	},
);
