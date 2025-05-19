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
import { fundCampaignsTable } from "./fundCampaigns";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for funds.
 */
export const fundsTable = pgTable(
	"funds",
	{
		/**
		 * Date time at the time the fund was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the fund.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the fund.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean to tell if the fund is tax deductible.
		 */
		isTaxDeductible: boolean("is_tax_deductible").notNull(),
		/**
		 * Name of the fund.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Foreign key reference to the id of the organization to which the fund is associated to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the fund was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the fund.
		 */
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

export const fundsTableRelations = relations(fundsTable, ({ one, many }) => ({
	/**
	 * Many to one relationship from `funds` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [fundsTable.creatorId],
		references: [usersTable.id],
		relationName: "funds.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `funds` table to `fund_campaigns` table.
	 */
	fundCampaignsWhereFund: many(fundCampaignsTable, {
		relationName: "fund_campaigns.fund_id:funds.id",
	}),
	/**
	 * Many to one relationship from `funds` table to `organizations` table.
	 */
	organization: one(organizationsTable, {
		fields: [fundsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "funds.organization_id:organizations.id",
	}),
	/**
	 * Many to one relationship from `funds` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [fundsTable.updaterId],
		references: [usersTable.id],
		relationName: "funds.updater_id:users.id",
	}),
}));

export const fundsTableInsertSchema = createInsertSchema(fundsTable, {
	name: (schema) => schema.min(1).max(256),
});
