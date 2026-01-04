import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { eventsTable } from "./events";
import { eventVolunteerMembershipsTable } from "./eventVolunteerMemberships";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for event volunteer groups.
 * Represents volunteer groups for specific events with leaders.
 */
export const eventVolunteerGroupsTable = pgTable(
	"event_volunteer_groups",
	{
		/**
		 * Primary unique identifier of the event volunteer group.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the event this group is for.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Boolean indicating if this is a template volunteer group (for recurring events).
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
		 * Foreign key reference to the user who leads this group.
		 */
		leaderId: uuid("leader_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who created this group.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Name of the volunteer group.
		 */
		name: text("name").notNull(),

		/**
		 * Description of the volunteer group.
		 */
		description: text("description"),

		/**
		 * Number of volunteers required for this group.
		 */
		volunteersRequired: integer("volunteers_required"),

		/**
		 * Date time at the time the event volunteer group was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the event volunteer group was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * Foreign key reference to the user who last updated this group.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		// Unique constraint: one group name per event per instance (or template)
		uniqueIndex().on(self.eventId, self.name, self.recurringEventInstanceId),
		index().on(self.createdAt),
		index().on(self.eventId),
		index().on(self.leaderId),
		index().on(self.name),
		index().on(self.isTemplate),
	],
);

export const eventVolunteerGroupsTableRelations = relations(
	eventVolunteerGroupsTable,
	({ many, one }) => ({
		/**
		 * Many to one relationship from `event_volunteer_groups` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [eventVolunteerGroupsTable.eventId],
			references: [eventsTable.id],
			relationName: "event_volunteer_groups.event_id:events.id",
		}),

		/**
		 * Many to one relationship from `event_volunteer_groups` table to `recurring_event_instances` table.
		 */
		recurringEventInstance: one(recurringEventInstancesTable, {
			fields: [eventVolunteerGroupsTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
			relationName:
				"event_volunteer_groups.recurring_event_instance_id:recurring_event_instances.id",
		}),

		/**
		 * Many to one relationship from `event_volunteer_groups` table to `users` table for leader.
		 */
		leader: one(usersTable, {
			fields: [eventVolunteerGroupsTable.leaderId],
			references: [usersTable.id],
			relationName: "event_volunteer_groups.leader_id:users.id",
		}),

		/**
		 * Many to one relationship from `event_volunteer_groups` table to `users` table for creator.
		 */
		creator: one(usersTable, {
			fields: [eventVolunteerGroupsTable.creatorId],
			references: [usersTable.id],
			relationName: "event_volunteer_groups.creator_id:users.id",
		}),

		/**
		 * Many to one relationship from `event_volunteer_groups` table to `users` table for updater.
		 */
		updater: one(usersTable, {
			fields: [eventVolunteerGroupsTable.updaterId],
			references: [usersTable.id],
			relationName: "event_volunteer_groups.updater_id:users.id",
		}),

		/**
		 * One to many relationship from `event_volunteer_groups` table to `volunteer_memberships` table.
		 */
		volunteerMemberships: many(eventVolunteerMembershipsTable, {
			relationName: "volunteer_memberships.group_id:event_volunteer_groups.id",
		}),
	}),
);

export const eventVolunteerGroupsTableInsertSchema = createInsertSchema(
	eventVolunteerGroupsTable,
);
