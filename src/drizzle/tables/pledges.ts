import { type InferSelectModel, relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { fundraisingCampaignsTable } from "./fundraisingCampaigns";
import { usersTable } from "./users";

export const pledgesTable = pgTable(
	"pledges",
	{
		amount: integer("amount").notNull(),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		endAt: timestamp("end_at", {
			mode: "date",
		}).notNull(),

		fundraisingCampaignId: uuid("fundraising_campaign_id")
			.notNull()
			.references(() => fundraisingCampaignsTable.id),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		isIncludeFamily: boolean("is_include_family").notNull().default(false),

		notes: text("notes"),

		pledgerId: uuid("pledger_id").references(() => usersTable.id),

		startAt: timestamp("start_at", {
			mode: "date",
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.endAt),
		index3: index().on(self.fundraisingCampaignId),
		index4: index().on(self.pledgerId),
		index5: index().on(self.startAt),
	}),
);

export type PledgePgType = InferSelectModel<typeof pledgesTable>;

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
