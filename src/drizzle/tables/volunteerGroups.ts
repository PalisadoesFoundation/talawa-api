import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { usersTable } from "./users";
import { volunteerGroupAssignmentsTable } from "./volunteerGroupAssignments";

export const volunteerGroupsTable = pgTable(
	"volunteer_groups",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {}),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		leaderId: uuid("leader_id").references(() => usersTable.id),

		maxVolunteerCount: integer("max_volunteer_count").notNull(),

		name: text("name").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.eventId),
		index3: index().on(self.leaderId),
		index4: index().on(self.name),
		uniqueIndex0: uniqueIndex().on(self.eventId, self.name),
	}),
);

export type VolunteerGroupPgType = InferSelectModel<
	typeof volunteerGroupsTable
>;

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
