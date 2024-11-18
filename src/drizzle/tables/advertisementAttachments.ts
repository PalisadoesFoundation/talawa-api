import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { advertisementAttachmentTypeEnum } from "~/src/drizzle/enums/advertisementAttachmentType";
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
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		position: integer("position").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),

		type: advertisementAttachmentTypeEnum("type").notNull(),
	},
	(self) => [
		index().on(self.advertisementId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		uniqueIndex().on(self.advertisementId, self.position),
	],
);

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
