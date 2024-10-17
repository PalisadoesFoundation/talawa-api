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
import { eventAttachmentTypeEnum } from "~/src/drizzle/enums";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const eventAttachmentsTable = pgTable(
	"event_attachments",
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

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		position: integer("position").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),

		type: text("type", {
			enum: eventAttachmentTypeEnum.options,
		}).notNull(),
	},
	(self) => ({
		index0: index().on(self.eventId),
		index1: index().on(self.createdAt),
		index2: index().on(self.creatorId),
		uniqueIndex0: uniqueIndex().on(self.eventId, self.position),
	}),
);

export type EventAttachmentPgType = InferSelectModel<
	typeof eventAttachmentsTable
>;

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
