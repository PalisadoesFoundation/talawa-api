import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { advertisementTypeEnum } from "~/src/drizzle/enums";
import { advertisementAttachmentsTable } from "./advertisementAttachments";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const advertisementsTable = pgTable(
	"advertisements",
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

		description: text("description"),

		endAt: timestamp("end_at", {
			mode: "date",
		}).notNull(),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

		startAt: timestamp("start_at", {
			mode: "date",
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		type: text("type", {
			enum: advertisementTypeEnum.options,
		}).notNull(),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.endAt),
		index3: index().on(self.name),
		index4: index().on(self.organizationId),
		index5: index().on(self.startAt),
		uniqueIndex0: uniqueIndex().on(self.name, self.organizationId),
	}),
);

export type AdvertisementPgType = InferSelectModel<typeof advertisementsTable>;

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
