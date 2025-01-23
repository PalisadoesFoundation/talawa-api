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
import { fundCampaignsTable } from "./fundCampaigns";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for fund campaign pledges.
 */
export const fundCampaignPledgesTable = pgTable(
	"fund_campaign_pledges",
	{
		/**
		 * The amount of pledged money.
		 */
		amount: integer("amount").notNull(),
		/**
		 * Foreign key reference to the id of the fund campaign to which the fund campaign pledge is associated to.
		 */
		campaignId: uuid("campaign_id")
			.notNull()
			.references(() => fundCampaignsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the fund campaign pledge was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the fund campaign pledge.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the fund campaign pledge.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Custom information about the fund campaign pledge.
		 */
		note: text("note"),
		/**
		 * Foreign key reference to the id of the user who pledged.
		 */
		pledgerId: uuid("pledger_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the fund campaign pledge was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the fund campaign pledge.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.campaignId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.pledgerId),
		uniqueIndex().on(self.campaignId, self.pledgerId),
	],
);

export const fundCampaignPledgesTableRelations = relations(
	fundCampaignPledgesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `fund_campaign_pledges` table to `fund_campaigns` table.
		 */
		campaign: one(fundCampaignsTable, {
			fields: [fundCampaignPledgesTable.campaignId],
			references: [fundCampaignsTable.id],
			relationName: "fund_campaigns.id:fund_campaign_pledges.campaign_id",
		}),
		/**
		 * Many to one relationship from `fund_campaign_pledges` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [fundCampaignPledgesTable.creatorId],
			references: [usersTable.id],
			relationName: "fund_campaign_pledges.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `fund_campaign_pledges` table to `users` table.
		 */
		pledger: one(usersTable, {
			fields: [fundCampaignPledgesTable.pledgerId],
			references: [usersTable.id],
			relationName: "fund_campaign_pledges.pledger_id:users.id",
		}),
		/**
		 * Many to one relationship from `fund_campaign_pledges` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [fundCampaignPledgesTable.updaterId],
			references: [usersTable.id],
			relationName: "fund_campaign_pledges.updater_id:users.id",
		}),
	}),
);

export const fundCampaignPledgesTableInsertSchema = createInsertSchema(
	fundCampaignPledgesTable,
	{
		amount: (schema) => schema.min(1),
		note: (schema) => schema.min(1).max(2048).optional(),
	},
);
