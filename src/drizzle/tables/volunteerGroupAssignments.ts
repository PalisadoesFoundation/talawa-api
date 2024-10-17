import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { volunteerGroupAssignmentInviteStatusEnum } from "~/src/drizzle/enums";
import { usersTable } from "./users";
import { volunteerGroupsTable } from "./volunteerGroups";

export const volunteerGroupAssignmentsTable = pgTable(
	"volunteer_group_assignments",
	{
		assigneeId: uuid("assignee_id")
			.notNull()
			.references(() => usersTable.id, {}),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		groupId: uuid("group_id")
			.notNull()
			.references(() => volunteerGroupsTable.id, {}),

		inviteStatus: text("invite_status", {
			enum: volunteerGroupAssignmentInviteStatusEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		compositePrimaryKey: primaryKey({
			columns: [self.assigneeId, self.groupId],
		}),
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.groupId),
	}),
);

export type VolunteerGroupAssignmentPgType = InferSelectModel<
	typeof volunteerGroupAssignmentsTable
>;

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
