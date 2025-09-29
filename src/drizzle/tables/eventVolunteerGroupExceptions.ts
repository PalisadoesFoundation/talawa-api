import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { eventVolunteerGroupsTable } from "./EventVolunteerGroup";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

export const eventVolunteerGroupExceptionsTable = pgTable(
	"event_volunteer_group_exceptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		volunteerGroupId: uuid("volunteer_group_id")
			.notNull()
			.references(() => eventVolunteerGroupsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		recurringEventInstanceId: uuid("recurring_event_instance_id")
			.notNull()
			.references(() => recurringEventInstancesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		// Core exception field for template-first approach
		isException: boolean("is_exception").notNull().default(false),
		// Override fields for instance-specific volunteer group data
		name: text("name"),
		description: text("description"),
		volunteersRequired: integer("volunteers_required"),
		leaderId: uuid("leader_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		// Legacy deletion field (kept for backwards compatibility)
		deleted: boolean("deleted").default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		createdBy: uuid("created_by").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		updatedBy: uuid("updated_by").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(table) => {
		return {
			unq: unique().on(table.volunteerGroupId, table.recurringEventInstanceId),
		};
	},
);

export const eventVolunteerGroupExceptionsTableRelations = relations(
	eventVolunteerGroupExceptionsTable,
	({ one }) => ({
		volunteerGroup: one(eventVolunteerGroupsTable, {
			fields: [eventVolunteerGroupExceptionsTable.volunteerGroupId],
			references: [eventVolunteerGroupsTable.id],
		}),
		recurringEventInstance: one(recurringEventInstancesTable, {
			fields: [eventVolunteerGroupExceptionsTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
		}),
		leader: one(usersTable, {
			fields: [eventVolunteerGroupExceptionsTable.leaderId],
			references: [usersTable.id],
		}),
		createdByUser: one(usersTable, {
			fields: [eventVolunteerGroupExceptionsTable.createdBy],
			references: [usersTable.id],
		}),
		updatedByUser: one(usersTable, {
			fields: [eventVolunteerGroupExceptionsTable.updatedBy],
			references: [usersTable.id],
		}),
	}),
);
