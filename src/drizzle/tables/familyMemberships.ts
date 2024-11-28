import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { familyMembershipRoleEnum } from "~/src/drizzle/enums/familyMembershipRole";
import { familiesTable } from "./families";
import { usersTable } from "./users";

export const familyMembershipsTable = pgTable(
	"family_memberships",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		familyId: uuid("family_id")
			.notNull()
			.references(() => familiesTable.id),

		memberId: uuid("member_id").references(() => usersTable.id),

		role: familyMembershipRoleEnum("role").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => [
		primaryKey({
			columns: [self.familyId, self.memberId],
		}),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.familyId),
		index().on(self.memberId),
	],
);

export const familyMembershipsTableRelations = relations(
	familyMembershipsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [familyMembershipsTable.creatorId],
			references: [usersTable.id],
			relationName: "family_memberships.creator_id:users.id",
		}),

		family: one(familiesTable, {
			fields: [familyMembershipsTable.familyId],
			references: [familiesTable.id],
			relationName: "families.id:family_memberships.family_id",
		}),

		member: one(usersTable, {
			fields: [familyMembershipsTable.memberId],
			references: [usersTable.id],
			relationName: "family_memberships.member_id:users.id",
		}),

		updater: one(usersTable, {
			fields: [familyMembershipsTable.updaterId],
			references: [usersTable.id],
			relationName: "family_memberships.updater_id:users.id",
		}),
	}),
);
