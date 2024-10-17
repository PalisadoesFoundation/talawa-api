import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { fundsTable } from "./funds";
import { pledgesTable } from "./pledges";
import { usersTable } from "./users";

export const fundraisingCampaignsTable = pgTable(
	"fundraising_campaigns",
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

		endAt: timestamp("end_at", {
			mode: "date",
		}).notNull(),

		fundId: uuid("fund_id")
			.notNull()
			.references(() => fundsTable.id),

		goalAmount: integer("goal_amount").notNull(),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		name: text("name", {}).notNull(),

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
		index3: index().on(self.fundId),
		index4: index().on(self.name),
		index5: index().on(self.startAt),
		unique0: unique().on(self.fundId, self.name),
	}),
);

export type FundraisingCampaignPgType = InferSelectModel<
	typeof fundraisingCampaignsTable
>;

export const fundraisingCampaignsTableRelations = relations(
	fundraisingCampaignsTable,
	({ many, one }) => ({
		creator: one(usersTable, {
			fields: [fundraisingCampaignsTable.creatorId],
			references: [usersTable.id],
			relationName: "fundraising_campaigns.creator_id:users.id",
		}),

		fund: one(fundsTable, {
			fields: [fundraisingCampaignsTable.fundId],
			references: [fundsTable.id],
			relationName: "fundraising_campaigns.fund_id:funds.id",
		}),

		pledgesWhereFundraisingCampaign: many(pledgesTable, {
			relationName: "fundraising_campaigns.id:pledges.fundraising_campaign_id",
		}),

		updater: one(usersTable, {
			fields: [fundraisingCampaignsTable.updaterId],
			references: [usersTable.id],
			relationName: "fundraising_campaigns.updater_id:users.id",
		}),
	}),
);
