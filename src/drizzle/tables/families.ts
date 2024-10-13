import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { familyMembershipsTable } from "./familyMemberships";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const familiesTable = pgTable(
	"families",
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

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.name),
		index3: index().on(self.organizationId),
		uniqueIndex0: uniqueIndex().on(self.name, self.organizationId),
	}),
);

export type FamilyPgType = InferSelectModel<typeof familiesTable>;

export const familiesTableRelations = relations(
	familiesTable,
	({ one, many }) => ({
		creator: one(usersTable, {
			fields: [familiesTable.creatorId],
			references: [usersTable.id],
			relationName: "families.creator_id:users.id",
		}),

		familyMembershipsWhereFamily: many(familyMembershipsTable, {
			relationName: "families.id:family_memberships.family_id",
		}),

		organization: one(organizationsTable, {
			fields: [familiesTable.organizationId],
			references: [organizationsTable.id],
			relationName: "families.organization_id:organizations.id",
		}),

		updater: one(usersTable, {
			fields: [familiesTable.updaterId],
			references: [usersTable.id],
			relationName: "families.updater_id:users.id",
		}),
	}),
);
