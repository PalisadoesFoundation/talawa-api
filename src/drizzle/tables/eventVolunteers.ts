import { relations, sql } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { eventsTable } from "./events";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for event volunteers.
 * Represents individual volunteers for specific events.
 */
export const eventVolunteersTable = pgTable(
	"event_volunteers",
	{
		/**
		 * Primary unique identifier of the event volunteer.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the user who is volunteering.
		 */
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the event being volunteered for.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Boolean indicating if this is a template volunteer (for recurring events).
		 */
		isTemplate: boolean("is_template").notNull().default(true),

		/**
		 * Foreign key reference to the specific recurring event instance (null for templates).
		 */
		recurringEventInstanceId: uuid("recurring_event_instance_id").references(
			() => recurringEventInstancesTable.id,
			{
				onDelete: "cascade",
				onUpdate: "cascade",
			},
		),

		/**
		 * Foreign key reference to the user who created this volunteer record.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Boolean indicating if the volunteer has accepted the invitation.
		 */
		hasAccepted: boolean("has_accepted").notNull().default(false),

		/**
		 * Boolean indicating if the volunteer profile is public.
		 */
		isPublic: boolean("is_public").notNull().default(true),

		/**
		 * Total hours volunteered by this volunteer for this event.
		 */
		hoursVolunteered: decimal("hours_volunteered", {
			precision: 10,
			scale: 2,
		})
			.notNull()
			.default("0"),

		/**
		 * Date time at the time the event volunteer was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the event volunteer was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * Foreign key reference to the user who last updated this volunteer record.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		// Unique constraint: one volunteer record per user per event per instance
		uniqueIndex()
			.on(self.userId, self.eventId, self.recurringEventInstanceId)
			.where(sql`${self.isTemplate} = false`),
		// Unique constraint: only one template volunteer record per user per event
		uniqueIndex()
			.on(self.userId, self.eventId)
			.where(sql`${self.isTemplate} = true`),
		index().on(self.createdAt),
		index().on(self.eventId),
		index().on(self.userId),
		index().on(self.hasAccepted),
		index().on(self.isTemplate),
	],
);

export const eventVolunteersTableRelations = relations(
	eventVolunteersTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `event_volunteers` table to `users` table.
		 */
		user: one(usersTable, {
			fields: [eventVolunteersTable.userId],
			references: [usersTable.id],
			relationName: "event_volunteers.user_id:users.id",
		}),

		/**
		 * Many to one relationship from `event_volunteers` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [eventVolunteersTable.eventId],
			references: [eventsTable.id],
			relationName: "event_volunteers.event_id:events.id",
		}),

		/**
		 * Many to one relationship from `event_volunteers` table to `recurring_event_instances` table.
		 */
		recurringEventInstance: one(recurringEventInstancesTable, {
			fields: [eventVolunteersTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
			relationName:
				"event_volunteers.recurring_event_instance_id:recurring_event_instances.id",
		}),

		/**
		 * Many to one relationship from `event_volunteers` table to `users` table for creator.
		 */
		creator: one(usersTable, {
			fields: [eventVolunteersTable.creatorId],
			references: [usersTable.id],
			relationName: "event_volunteers.creator_id:users.id",
		}),

		/**
		 * Many to one relationship from `event_volunteers` table to `users` table for updater.
		 */
		updater: one(usersTable, {
			fields: [eventVolunteersTable.updaterId],
			references: [usersTable.id],
			relationName: "event_volunteers.updater_id:users.id",
		}),
	}),
);

export const eventVolunteersTableInsertSchema =
	createInsertSchema(eventVolunteersTable);
