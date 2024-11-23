import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const organizationMembershipsTable = pgTable(
	"organization_memberships",
	{
		/**
		 * Datetime at the time the organization membership was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who first created the organization membership.
		 */
		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),
		/**
		 * Boolean to tell whether the membership has been approved.
		 */
		isApproved: boolean("is_approved").notNull(),
		/**
		 * Foreign key reference to the id of the user the membership is associated to.
		 */
		memberId: uuid("member_id")
			.notNull()
			.references(() => usersTable.id, {}),
		/**
		 * Foreign key reference to the id of the organization the membership is associated to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),
		/**
		 * Role assigned to the user within the organization.
		 */
		role: organizationMembershipRoleEnum("role").notNull(),
		/**
		 * Datetime at the time the organization membership was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Foreign key reference to the id of the user who last updated the organization membership.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		primaryKey({
			columns: [self.memberId, self.organizationId],
		}),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.isApproved),
		index().on(self.memberId),
		index().on(self.organizationId),
	],
);

export const organizationMembershipsTableRelations = relations(
	organizationMembershipsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [organizationMembershipsTable.creatorId],
			references: [usersTable.id],
			relationName: "organization_memberships.creator_id:users.id",
		}),

		member: one(usersTable, {
			fields: [organizationMembershipsTable.memberId],
			references: [usersTable.id],
			relationName: "organization_memberships.member_id:users.id",
		}),

		organization: one(organizationsTable, {
			fields: [organizationMembershipsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "organization_memberships.organization_id:organizations.id",
		}),

		updater: one(usersTable, {
			fields: [organizationMembershipsTable.updaterId],
			references: [usersTable.id],
			relationName: "organization_memberships.updater_id:users.id",
		}),
	}),
);
