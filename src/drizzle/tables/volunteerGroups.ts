import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { eventsTable } from "./events";
import { usersTable } from "./users";
import { volunteerGroupAssignmentsTable } from "./volunteerGroupAssignments";

export const volunteerGroupsTable = pgTable(
	"volunteer_groups",
	{
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

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		id: uuid("id").primaryKey().$default(uuidv7),

		leaderId: uuid("leader_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		maxVolunteerCount: integer("max_volunteer_count").notNull(),

		name: text("name").notNull(),

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
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
		index().on(self.leaderId),
		index().on(self.name),
		uniqueIndex().on(self.eventId, self.name),
	],
);

export const volunteerGroupsTableRelations = relations(
	volunteerGroupsTable,
	({ many, one }) => ({
		creator: one(usersTable, {
			fields: [volunteerGroupsTable.creatorId],
			references: [usersTable.id],
			relationName: "users.id:volunteer_groups.creator_id",
		}),

		event: one(eventsTable, {
			fields: [volunteerGroupsTable.eventId],
			references: [eventsTable.id],
			relationName: "events.id:volunteer_groups.event_id",
		}),

		leader: one(usersTable, {
			fields: [volunteerGroupsTable.leaderId],
			references: [usersTable.id],
			relationName: "users.id:volunteer_groups.leader_id",
		}),

		volunteerGroupAssignmentsWhereGroup: many(volunteerGroupAssignmentsTable, {
			relationName: "volunteer_group_assignments.group_id:volunteer_groups.id",
		}),

		updater: one(usersTable, {
			fields: [volunteerGroupsTable.updaterId],
			references: [usersTable.id],
			relationName: "users.id:volunteer_groups.updater_id",
		}),
	}),
);
