import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { iso4217CurrencyCodeEnum } from "~/src/drizzle/enums/iso4217CurrencyCode";
import { fundCampaignPledgesTable } from "./fundCampaignPledges";
import { fundsTable } from "./funds";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for fund campaigns.
 */
export const fundCampaignsTable = pgTable(
	"fund_campaigns",
	{
		/**
		 * Date time at the time the fund campaign was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the fund campaign.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Currency code of the fund campaign.
		 */
		currencyCode: text("currency_code", {
			enum: iso4217CurrencyCodeEnum.options,
		}).notNull(),
		/**
		 * Date time at the time the fund campaign ends at.
		 */
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		/**
		 * Foreign key reference to the id of the fund associated to the campaign.
		 */
		fundId: uuid("fund_id")
			.notNull()
			.references(() => fundsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Minimum amount of money that is set as the goal for the fund campaign.
		 */
		goalAmount: integer("goal_amount").notNull(),
		/**
		 * Primary unique identifier of the fund campaign.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Name of the fund campaign.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Date time at the time the fund campaign starts at.
		 */
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		/**
		 * Date time at the time the fund campaign was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the fund campaign.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.endAt),
		index().on(self.fundId),
		index().on(self.name),
		index().on(self.startAt),
		uniqueIndex().on(self.fundId, self.name),
	],
);

export const fundCampaignsTableRelations = relations(
	fundCampaignsTable,
	({ many, one }) => ({
		/**
		 * Many to one relationship from `fund_campaigns` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [fundCampaignsTable.creatorId],
			references: [usersTable.id],
			relationName: "fund_campaigns.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `fund_campaigns` table to `funds` table.
		 */
		fund: one(fundsTable, {
			fields: [fundCampaignsTable.fundId],
			references: [fundsTable.id],
			relationName: "fund_campaigns.fund_id:funds.id",
		}),
		/**
		 * One to many relationship from `fund_campaign_pledges` table to `fund_campaigns` table.
		 */
		fundCampaignPledgesWhereCampaign: many(fundCampaignPledgesTable, {
			relationName: "fund_campaigns.id:fund_campaign_pledges.campaign_id",
		}),
		/**
		 * Many to one relationship from `fund_campaigns` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [fundCampaignsTable.updaterId],
			references: [usersTable.id],
			relationName: "fund_campaigns.updater_id:users.id",
		}),
	}),
);

export const fundCampaignsTableInsertSchema = createInsertSchema(
	fundCampaignsTable,
	{
		name: (schema) => schema.min(1).max(256),
	},
);
