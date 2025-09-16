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
import { eventVolunteersTable } from "./EventVolunteer";
import { eventVolunteerGroupsTable } from "./EventVolunteerGroup";
import { eventsTable } from "./events";
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
export const volunteerMembershipsTable = pgTable(
	"volunteer_memberships",
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
		// Unique constraint: one membership record per volunteer per group (or per event if no group)
		uniqueIndex().on(self.volunteerId, self.groupId, self.eventId),
		index().on(self.createdAt),
		index().on(self.eventId),
		index().on(self.volunteerId),
		index().on(self.status),
	],
);

export const volunteerMembershipsTableRelations = relations(
	volunteerMembershipsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `volunteer_memberships` table to `event_volunteers` table.
		 */
		volunteer: one(eventVolunteersTable, {
			fields: [volunteerMembershipsTable.volunteerId],
			references: [eventVolunteersTable.id],
			relationName: "volunteer_memberships.volunteer_id:event_volunteers.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [volunteerMembershipsTable.eventId],
			references: [eventsTable.id],
			relationName: "volunteer_memberships.event_id:events.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `users` table for createdBy.
		 */
		createdByUser: one(usersTable, {
			fields: [volunteerMembershipsTable.createdBy],
			references: [usersTable.id],
			relationName: "volunteer_memberships.created_by:users.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `users` table for updatedBy.
		 */
		updatedByUser: one(usersTable, {
			fields: [volunteerMembershipsTable.updatedBy],
			references: [usersTable.id],
			relationName: "volunteer_memberships.updated_by:users.id",
		}),

		/**
		 * Many to one relationship from `volunteer_memberships` table to `event_volunteer_groups` table.
		 */
		group: one(eventVolunteerGroupsTable, {
			fields: [volunteerMembershipsTable.groupId],
			references: [eventVolunteerGroupsTable.id],
			relationName: "volunteer_memberships.group_id:event_volunteer_groups.id",
		}),
	}),
);

export const volunteerMembershipsTableInsertSchema = createInsertSchema(
	volunteerMembershipsTable,
);
