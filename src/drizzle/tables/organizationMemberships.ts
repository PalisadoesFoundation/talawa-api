import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for organization memberships.
 */
export const organizationMembershipsTable = pgTable(
	"organization_memberships",
	{
		/**
		 * Date time at the time the organization membership was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the organization membership.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the user the membership is associated to.
		 */
		memberId: uuid("member_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key reference to the id of the organization the membership is associated to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Role assigned to the user within the organization.
		 */
		role: text("role", {
			enum: organizationMembershipRoleEnum.options,
		}).notNull(),
		/**
		 * Date time at the time the organization membership was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the organization membership.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.memberId),
		index().on(self.organizationId),
		index().on(self.role),
		primaryKey({
			columns: [self.memberId, self.organizationId],
		}),
	],
);

export const organizationMembershipsTableRelations = relations(
	organizationMembershipsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `organization_memberships` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [organizationMembershipsTable.creatorId],
			references: [usersTable.id],
			relationName: "organization_memberships.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `organization_memberships` table to `users` table.
		 */
		member: one(usersTable, {
			fields: [organizationMembershipsTable.memberId],
			references: [usersTable.id],
			relationName: "organization_memberships.member_id:users.id",
		}),
		/**
		 * Many to one relationship from `organization_memberships` table to `organizations` table.
		 */
		organization: one(organizationsTable, {
			fields: [organizationMembershipsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "organization_memberships.organization_id:organizations.id",
		}),
		/**
		 * Many to one relationship from `organization_memberships` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [organizationMembershipsTable.updaterId],
			references: [usersTable.id],
			relationName: "organization_memberships.updater_id:users.id",
		}),
	}),
);

export const organizationMembershipsTableInsertSchema = createInsertSchema(
	organizationMembershipsTable,
);
