import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { fundraisingCampaignsTable } from "./fundraisingCampaigns";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const fundsTable = pgTable(
	"funds",
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

		id: uuid("id").primaryKey().$default(uuidv7),

		isArchived: boolean("is_archived").notNull(),

		isDefault: boolean("is_default").notNull(),

		isTaxDeductible: boolean("is_tax_deductibe").notNull(),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

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
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.organizationId),
		unique().on(self.name, self.organizationId),
	],
);

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
