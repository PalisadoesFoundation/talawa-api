import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eventAttachmentTypeEnum } from "~/src/drizzle/enums/eventAttachmentType";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const eventAttachmentsTable = pgTable(
	"event_attachments",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		uri: text("uri", {}).notNull(),

		type: text("type", {
			enum: eventAttachmentTypeEnum.options,
		}).notNull(),
	},
	(self) => [
		index().on(self.eventId),
		index().on(self.createdAt),
		index().on(self.creatorId),
	],
);

export const eventAttachmentsTableRelations = relations(
	eventAttachmentsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [eventAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "event_attachments.creator_id:users.id",
		}),

		event: one(eventsTable, {
			fields: [eventAttachmentsTable.eventId],
			references: [eventsTable.id],
			relationName: "event_attachments.event_id:events.id",
		}),

		updater: one(usersTable, {
			fields: [eventAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "event_attachments.updater_id:users.id",
		}),
	}),
);
