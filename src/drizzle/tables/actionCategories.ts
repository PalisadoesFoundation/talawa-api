import { type InferSelectModel, relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { actionsTable } from "./actions";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const actionCategoriesTable = pgTable(
	"action_categories",
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

		description: text("description"),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		isDisabled: boolean("is_disabled").notNull().default(false),

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
		uniqueIndex0: uniqueIndex().on(self.name, self.organizationId),
	}),
);

export type ActionCategoryPgType = InferSelectModel<
	typeof actionCategoriesTable
>;

export const actionCategoriesTableRelations = relations(
	actionCategoriesTable,
	({ many, one }) => ({
		actionsWhereCategory: many(actionsTable, {
			relationName: "action_categories.id:actions.category_id",
		}),

		creator: one(usersTable, {
			fields: [actionCategoriesTable.creatorId],
			references: [usersTable.id],
			relationName: "action_categories.creator_id:users.id",
		}),

		organization: one(organizationsTable, {
			fields: [actionCategoriesTable.organizationId],
			references: [organizationsTable.id],
			relationName: "action_categories.organization_id:organizations.id",
		}),

		updater: one(usersTable, {
			fields: [actionCategoriesTable.updaterId],
			references: [usersTable.id],
			relationName: "action_categories.updater_id:users.id",
		}),
	}),
);
