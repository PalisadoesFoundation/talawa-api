import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { advertisementTypeEnum } from "~/src/drizzle/enums/advertisementType";
import { advertisementAttachmentsTable } from "./advertisementAttachments";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const advertisementsTable = pgTable(
	"advertisements",
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

		description: text("description"),

		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		id: uuid("id").primaryKey().$default(uuidv7),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		type: advertisementTypeEnum("type").notNull(),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.endAt),
		index().on(self.name),
		index().on(self.organizationId),
		index().on(self.startAt),
		uniqueIndex().on(self.name, self.organizationId),
	],
);

export const advertisementsTableRelations = relations(
	advertisementsTable,
	({ many, one }) => ({
		advertisementAttachmentsWhereAdvertisement: many(
			advertisementAttachmentsTable,
			{
				relationName:
					"advertisement_attachments.advertisement_id:advertisements.id",
			},
		),

		creator: one(usersTable, {
			fields: [advertisementsTable.creatorId],
			references: [usersTable.id],
			relationName: "advertisements.creator_id:users.id",
		}),

		organization: one(organizationsTable, {
			fields: [advertisementsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "advertisements.organization_id:organizations.id",
		}),

		updater: one(usersTable, {
			fields: [advertisementsTable.updaterId],
			references: [usersTable.id],
			relationName: "advertisements.updater_id:users.id",
		}),
	}),
);
