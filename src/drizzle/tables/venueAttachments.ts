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
import { venueAttachmentTypeEnum } from "~/src/drizzle/enums";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

export const venueAttachmentsTable = pgTable(
	"venue_attachments",
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

		position: integer("position").notNull(),

		type: text("type", {
			enum: venueAttachmentTypeEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),

		venueId: uuid("venue_id")
			.notNull()
			.references(() => venuesTable.id),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.venueId),
		uniqueIndex0: uniqueIndex().on(self.position, self.venueId),
	}),
);

export type VenueAttachmentPgType = InferSelectModel<
	typeof venueAttachmentsTable
>;

export const venueAttachmentsTableRelations = relations(
	venueAttachmentsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [venueAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "users.id:venue_attachments.creator_id",
		}),

		updater: one(usersTable, {
			fields: [venueAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "users.id:venue_attachments.updater_id",
		}),

		venue: one(venuesTable, {
			fields: [venueAttachmentsTable.venueId],
			references: [venuesTable.id],
			relationName: "venue_attachments.venue_id:venues.id",
		}),
	}),
);
