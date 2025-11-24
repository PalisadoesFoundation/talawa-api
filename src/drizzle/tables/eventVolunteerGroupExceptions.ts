import { relations } from "drizzle-orm";
import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { eventVolunteerGroupsTable } from "./eventVolunteerGroups";
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
