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
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { actionItemsTable } from "./actionItems";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const actionItemCategoriesTable = pgTable(
	"actionitem_categories",
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

export const actionItemCategoriesTableRelations = relations(
	actionItemCategoriesTable,
	({ many, one }) => ({
		actionItemsWhereCategory: many(actionItemsTable, {
			relationName: "actionitem_categories.id:actionitems.category_id",
		}),
		creator: one(usersTable, {
			fields: [actionItemCategoriesTable.creatorId],
			references: [usersTable.id],
			relationName: "actionitem_categories.creator_id:users.id",
		}),
		organization: one(organizationsTable, {
			fields: [actionItemCategoriesTable.organizationId],
			references: [organizationsTable.id],
			relationName: "actionitem_categories.organization_id:organizations.id",
		}),
		updater: one(usersTable, {
			fields: [actionItemCategoriesTable.updaterId],
			references: [usersTable.id],
			relationName: "actionitem_categories.updater_id:users.id",
		}),
	}),
);

export const actionItemCategoriesTableInsertSchema = createInsertSchema(
	actionItemCategoriesTable,
	{
		description: (schema) => schema.min(1).max(2048).optional(),
		name: (schema) => schema.min(1).max(256),
	},
);
