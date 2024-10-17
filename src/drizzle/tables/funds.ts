import { type InferSelectModel, relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { fundraisingCampaignsTable } from "./fundraisingCampaigns";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const fundsTable = pgTable(
	"funds",
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

		isArchived: boolean("is_archived").notNull().default(false),

		isDefault: boolean("is_default").notNull().default(false),

		isTaxDeductible: boolean("is_tax_deductibe").notNull().default(false),

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
		unique0: unique().on(self.name, self.organizationId),
	}),
);

export type FundPgType = InferSelectModel<typeof fundsTable>;

export const fundsTableRelations = relations(fundsTable, ({ one, many }) => ({
	creator: one(usersTable, {
		fields: [fundsTable.creatorId],
		references: [usersTable.id],
		relationName: "funds.creator_id:users.id",
	}),

	fundraisingCampaignsWhereFund: many(fundraisingCampaignsTable, {
		relationName: "fundraising_campaigns.fund_id:funds.id",
	}),

	organization: one(organizationsTable, {
		fields: [fundsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "funds.organization_id:organizations.id",
	}),

	updater: one(usersTable, {
		fields: [fundsTable.updaterId],
		references: [usersTable.id],
		relationName: "funds.updater_id:users.id",
	}),
}));
