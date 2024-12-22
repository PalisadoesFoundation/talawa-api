import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { volunteerGroupAssignmentInviteStatusEnum } from "~/src/drizzle/enums/volunteerGroupAssignmentInviteStatus";
import { usersTable } from "./users";
import { volunteerGroupsTable } from "./volunteerGroups";

export const volunteerGroupAssignmentsTable = pgTable(
	"volunteer_group_assignments",
	{
		assigneeId: uuid("assignee_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
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

		groupId: uuid("group_id")
			.notNull()
			.references(() => volunteerGroupsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		inviteStatus: text("invite_status", {
			enum: volunteerGroupAssignmentInviteStatusEnum.options,
		}).notNull(),

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
		primaryKey({
			columns: [self.assigneeId, self.groupId],
		}),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.groupId),
	],
);

export const volunteerGroupAssignmentsTableRelations = relations(
	volunteerGroupAssignmentsTable,
	({ one }) => ({
		assignee: one(usersTable, {
			fields: [volunteerGroupAssignmentsTable.assigneeId],
			references: [usersTable.id],
			relationName: "users.id:volunteer_group_assignments.assignee_id",
		}),

		creator: one(usersTable, {
			fields: [volunteerGroupAssignmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "users.id:volunteer_group_assignments.creator_id",
		}),

		group: one(volunteerGroupsTable, {
			fields: [volunteerGroupAssignmentsTable.groupId],
			references: [volunteerGroupsTable.id],
			relationName: "volunteer_group_assignments.group_id:volunteer_groups.id",
		}),

		updater: one(usersTable, {
			fields: [volunteerGroupAssignmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "users.id:volunteer_group_assignments.updater_id",
		}),
	}),
);
