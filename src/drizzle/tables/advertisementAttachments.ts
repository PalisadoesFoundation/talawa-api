import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { advertisementAttachmentTypeEnum } from "~/src/drizzle/enums";
import { advertisementsTable } from "./advertisements";
import { usersTable } from "./users";

export const advertisementAttachmentsTable = pgTable(
	"advertisement_attachments",
	{
		advertisementId: uuid("advertisement_id")
			.notNull()
			.references(() => advertisementsTable.id),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		position: integer("position").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),

		type: text("type", {
			enum: advertisementAttachmentTypeEnum.options,
		}).notNull(),
	},
	(self) => ({
		index0: index().on(self.advertisementId),
		index1: index().on(self.createdAt),
		index2: index().on(self.creatorId),
		uniqueIndex0: uniqueIndex().on(self.advertisementId, self.position),
	}),
);

export type AdvertisementAttachmentPgType = InferSelectModel<
	typeof advertisementAttachmentsTable
>;

export const advertisementAttachmentsTableRelations = relations(
	advertisementAttachmentsTable,
	({ one }) => ({
		advertisement: one(advertisementsTable, {
			fields: [advertisementAttachmentsTable.advertisementId],
			references: [advertisementsTable.id],
			relationName:
				"advertisement_attachments.advertisement_id:advertisements.id",
		}),

		creator: one(usersTable, {
			fields: [advertisementAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "advertisement_attachments.creator_id:users.id",
		}),

		updater: one(usersTable, {
			fields: [advertisementAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "advertisement_attachments.updater_id:users.id",
		}),
	}),
);
