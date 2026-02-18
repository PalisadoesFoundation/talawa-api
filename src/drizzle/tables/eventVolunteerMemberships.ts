import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { eventsTable } from "./events";
import { eventVolunteerGroupsTable } from "./eventVolunteerGroups";
import { eventVolunteersTable } from "./eventVolunteers";
import { usersTable } from "./users";

/**
 * Enum for volunteer membership status.
 * Based on the old Talawa API VolunteerMembership status values.
 */
export const volunteerMembershipStatusEnum = [
	"invited",
	"requested",
	"accepted",
	"rejected",
] as const;

/**
 * Drizzle orm postgres table definition for volunteer memberships.
 * Represents the relationship between volunteers and volunteer groups.
 */
export const eventVolunteerMembershipsTable = pgTable(
	"event_volunteer_memberships",
	{
		/**
		 * Primary unique identifier of the volunteer membership.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the event volunteer.
		 */
		volunteerId: uuid("volunteer_id")
			.notNull()
			.references(() => eventVolunteersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the volunteer group (optional for individual volunteers).
		 */
		groupId: uuid("group_id").references(() => eventVolunteerGroupsTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),

		/**
		 * Foreign key reference to the event.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Status of the volunteer membership.
		 */
		status: text("status", {
			enum: volunteerMembershipStatusEnum,
		}).notNull(),

		/**
		 * Foreign key reference to the user who created this membership.
		 */
		createdBy: uuid("created_by").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Foreign key reference to the user who last updated this membership.
		 */
		updatedBy: uuid("updated_by").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Date time at the time the volunteer membership was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the volunteer membership was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
	},
	(self) => [
		// Ensures a volunteer has at most one membership per group (groupId IS NOT NULL).
		uniqueIndex()
			.on(self.volunteerId, self.groupId, self.eventId)
			.where(sql`${self.groupId} IS NOT NULL`),
		// Ensures a volunteer has at most one direct event-level membership when not assigned to any group (groupId IS NULL).
		uniqueIndex()
			.on(self.volunteerId, self.eventId)
			.where(sql`${self.groupId} IS NULL`),
		index().on(self.createdAt),
		index().on(self.eventId),
		index().on(self.volunteerId),
		index().on(self.status),
	],
);

export const eventVolunteerMembershipsTableRelations = relations(
	eventVolunteerMembershipsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `volunteer_memberships` table to `event_volunteers` table.
		 */
		volunteer: one(eventVolunteersTable, {
			fields: [eventVolunteerMembershipsTable.volunteerId],
			references: [eventVolunteersTable.id],
			relationName: "volunteer_memberships.volunteer_id:event_volunteers.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [eventVolunteerMembershipsTable.eventId],
			references: [eventsTable.id],
			relationName: "volunteer_memberships.event_id:events.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `users` table for createdBy.
		 */
		createdByUser: one(usersTable, {
			fields: [eventVolunteerMembershipsTable.createdBy],
			references: [usersTable.id],
			relationName: "volunteer_memberships.created_by:users.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `users` table for updatedBy.
		 */
		updatedByUser: one(usersTable, {
			fields: [eventVolunteerMembershipsTable.updatedBy],
			references: [usersTable.id],
			relationName: "volunteer_memberships.updated_by:users.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `event_volunteer_groups` table.
		 */
		group: one(eventVolunteerGroupsTable, {
			fields: [eventVolunteerMembershipsTable.groupId],
			references: [eventVolunteerGroupsTable.id],
			relationName: "volunteer_memberships.group_id:event_volunteer_groups.id",
		}),
	}),
);

export const eventVolunteerMembershipsTableInsertSchema = createInsertSchema(
	eventVolunteerMembershipsTable,
);
