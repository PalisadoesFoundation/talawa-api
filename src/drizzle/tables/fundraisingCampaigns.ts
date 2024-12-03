import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { fundsTable } from "./funds";
import { pledgesTable } from "./pledges";
import { usersTable } from "./users";

export const fundraisingCampaignsTable = pgTable(
	"fundraising_campaigns",
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

		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		fundId: uuid("fund_id")
			.notNull()
			.references(() => fundsTable.id),

		goalAmount: integer("goal_amount").notNull(),

		id: uuid("id").primaryKey().$default(uuidv7),

		name: text("name", {}).notNull(),

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
		index().on(self.fundId),
		index().on(self.name),
		index().on(self.startAt),
		unique().on(self.fundId, self.name),
	],
);

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
