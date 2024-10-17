import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { familyMembershipRoleEnum } from "~/src/drizzle/enums";
import { familiesTable } from "./families";
import { usersTable } from "./users";

export const familyMembershipsTable = pgTable(
	"family_memberships",
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

		familyId: uuid("family_id")
			.notNull()
			.references(() => familiesTable.id),

		memberId: uuid("member_id").references(() => usersTable.id),

		role: text("role", {
			enum: familyMembershipRoleEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		compositePrimaryKey: primaryKey({
			columns: [self.familyId, self.memberId],
		}),
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.familyId),
		index3: index().on(self.memberId),
	}),
);

export type FamilyMembershipPgType = InferSelectModel<
	typeof familyMembershipsTable
>;

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
