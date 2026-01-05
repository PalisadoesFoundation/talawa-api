import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { actionItemCategoriesTable } from "./actionItemCategories";
import { eventsTable } from "./events";
import { eventVolunteerGroupsTable } from "./eventVolunteerGroups";
import { eventVolunteersTable } from "./eventVolunteers";
import { organizationsTable } from "./organizations";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

export const actionItemsTable = pgTable(
	"actionitems",
	{
		assignedAt: timestamp("assigned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		volunteerId: uuid("volunteer_id").references(
			() => eventVolunteersTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),
		volunteerGroupId: uuid("volunteer_group_id").references(
			() => eventVolunteerGroupsTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),
		categoryId: uuid("category_id").references(
			() => actionItemCategoriesTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),
		completionAt: timestamp("completion_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		eventId: uuid("event_id").references(() => eventsTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		recurringEventInstanceId: uuid("recurring_event_instance_id").references(
			() => recurringEventInstancesTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),
		id: uuid("id").primaryKey().$default(uuidv7),
		isCompleted: boolean("is_completed").notNull(),
		isTemplate: boolean("is_template").default(false),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		postCompletionNotes: text("post_completion_notes"),
		preCompletionNotes: text("pre_completion_notes"),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.assignedAt),
		index().on(self.volunteerId),
		index().on(self.volunteerGroupId),
		index().on(self.categoryId),
		index().on(self.completionAt),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.organizationId),
	],
);

export const actionItemsTableRelations = relations(
	actionItemsTable,
	({ one }) => ({
		volunteer: one(eventVolunteersTable, {
			fields: [actionItemsTable.volunteerId],
			references: [eventVolunteersTable.id],
			relationName: "actionitems.volunteer_id:event_volunteers.id",
		}),
		volunteerGroup: one(eventVolunteerGroupsTable, {
			fields: [actionItemsTable.volunteerGroupId],
			references: [eventVolunteerGroupsTable.id],
			relationName: "actionitems.volunteer_group_id:event_volunteer_groups.id",
		}),
		category: one(actionItemCategoriesTable, {
			fields: [actionItemsTable.categoryId],
			references: [actionItemCategoriesTable.id],
			relationName: "actionitem_categories.id:actionitems.category_id",
		}),
		creator: one(usersTable, {
			fields: [actionItemsTable.creatorId],
			references: [usersTable.id],
			relationName: "actionitems.creator_id:users.id",
		}),
		event: one(eventsTable, {
			fields: [actionItemsTable.eventId],
			references: [eventsTable.id],
			relationName: "actionitems.event_id:events.id",
		}),
		organization: one(organizationsTable, {
			fields: [actionItemsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "actionitems.organization_id:organizations.id",
		}),
		updater: one(usersTable, {
			fields: [actionItemsTable.updaterId],
			references: [usersTable.id],
			relationName: "actionitems.updater_id:users.id",
		}),
	}),
);

export const actionItemsTableInsertSchema =
	createInsertSchema(actionItemsTable);
