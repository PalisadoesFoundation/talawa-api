import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { familyMembershipsTable } from "./familyMemberships";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const familiesTable = pgTable(
	"families",
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

		id: uuid("id").primaryKey().$default(uuidv7),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

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
		index().on(self.name),
		index().on(self.organizationId),
		uniqueIndex().on(self.name, self.organizationId),
	],
);

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
