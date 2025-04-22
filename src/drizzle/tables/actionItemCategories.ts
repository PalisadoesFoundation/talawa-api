import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { actionItems } from "./actionItems";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const actionItemCategories = pgTable(
	"action_categories",
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

		description: text("description"),

		id: uuid("id").primaryKey().$default(uuidv7),

		isDisabled: boolean("is_disabled").notNull(),

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
		uniqueIndex().on(self.name, self.organizationId),
	],
);

export const actionItemCategoriesRelations = relations(
	actionItemCategories,
	({ many, one }) => ({
		actionsWhereCategory: many(actionItems, {
			relationName: "action_categories.id:actions.category_id",
		}),

		creator: one(usersTable, {
			fields: [actionItemCategories.creatorId],
			references: [usersTable.id],
			relationName: "action_categories.creator_id:users.id",
		}),

		organization: one(organizationsTable, {
			fields: [actionItemCategories.organizationId],
			references: [organizationsTable.id],
			relationName: "action_categories.organization_id:organizations.id",
		}),

		updater: one(usersTable, {
			fields: [actionItemCategories.updaterId],
			references: [usersTable.id],
			relationName: "action_categories.updater_id:users.id",
		}),
	}),
);
