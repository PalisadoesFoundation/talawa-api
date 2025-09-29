import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	pgTable,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { eventVolunteersTable } from "./EventVolunteer";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

export const eventVolunteerExceptionsTable = pgTable(
	"event_volunteer_exceptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		volunteerId: uuid("volunteer_id")
			.notNull()
			.references(() => eventVolunteersTable.id, {
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
		// Override fields for instance-specific volunteer data
		hasAccepted: boolean("has_accepted"),
		isPublic: boolean("is_public"),
		hoursVolunteered: decimal("hours_volunteered", {
			precision: 10,
			scale: 2,
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
			unq: unique().on(table.volunteerId, table.recurringEventInstanceId),
		};
	},
);

export const eventVolunteerExceptionsTableRelations = relations(
	eventVolunteerExceptionsTable,
	({ one }) => ({
		volunteer: one(eventVolunteersTable, {
			fields: [eventVolunteerExceptionsTable.volunteerId],
			references: [eventVolunteersTable.id],
		}),
		recurringEventInstance: one(recurringEventInstancesTable, {
			fields: [eventVolunteerExceptionsTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
		}),
		createdByUser: one(usersTable, {
			fields: [eventVolunteerExceptionsTable.createdBy],
			references: [usersTable.id],
		}),
		updatedByUser: one(usersTable, {
			fields: [eventVolunteerExceptionsTable.updatedBy],
			references: [usersTable.id],
		}),
	}),
);
