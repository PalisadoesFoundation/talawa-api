import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { fundraisingCampaignsTable } from "./fundraisingCampaigns";
import { usersTable } from "./users";

export const pledgesTable = pgTable(
	"pledges",
	{
		amount: integer("amount").notNull(),

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

		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		fundraisingCampaignId: uuid("fundraising_campaign_id")
			.notNull()
			.references(() => fundraisingCampaignsTable.id),

		id: uuid("id").primaryKey().$default(uuidv7),

		isIncludeFamily: boolean("is_include_family").notNull(),

		notes: text("notes"),

		pledgerId: uuid("pledger_id").references(() => usersTable.id),

		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

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
		index().on(self.endAt),
		index().on(self.fundraisingCampaignId),
		index().on(self.pledgerId),
		index().on(self.startAt),
	],
);

export const pledgesTableRelations = relations(pledgesTable, ({ one }) => ({
	creator: one(usersTable, {
		fields: [pledgesTable.creatorId],
		references: [usersTable.id],
		relationName: "pledges.creator_id:users.id",
	}),

	fundraisingCampaign: one(fundraisingCampaignsTable, {
		fields: [pledgesTable.fundraisingCampaignId],
		references: [fundraisingCampaignsTable.id],
		relationName: "fundraising_campaigns.id:pledges.fundraising_campaign_id",
	}),

	pledger: one(usersTable, {
		fields: [pledgesTable.pledgerId],
		references: [usersTable.id],
		relationName: "pledges.pledger_id:users.id",
	}),

	updater: one(usersTable, {
		fields: [pledgesTable.updaterId],
		references: [usersTable.id],
		relationName: "pledges.updater_id:users.id",
	}),
}));
