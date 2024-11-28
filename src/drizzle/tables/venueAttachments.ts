import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { venueAttachmentTypeEnum } from "~/src/drizzle/enums/venueAttachmentType";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

export const venueAttachmentsTable = pgTable(
	"venue_attachments",
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

		type: venueAttachmentTypeEnum("type").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),

		venueId: uuid("venue_id")
			.notNull()
			.references(() => venuesTable.id),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.venueId),
	],
);

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
