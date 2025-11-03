import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { chatMessagesTable } from "./chatMessages";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for per-message read receipts.
 * Composite primary key ensures one receipt per (message, reader).
 */
export const chatMessageReadReceiptsTable = pgTable(
	"chat_message_read_receipts",
	{
		/**
		 * Foreign key to chat message that was read.
		 */
		messageId: uuid("message_id")
			.notNull()
			.references(() => chatMessagesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key to user who read the message.
		 */
		readerId: uuid("reader_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * When the message was read.
		 */
		readAt: timestamp("read_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(self) => [
		primaryKey({ columns: [self.messageId, self.readerId] }),
		index().on(self.messageId),
	],
);

export const chatMessageReadReceiptsRelations = relations(
	chatMessageReadReceiptsTable,
	({ one }) => ({
		message: one(chatMessagesTable, {
			fields: [chatMessageReadReceiptsTable.messageId],
			references: [chatMessagesTable.id],
			relationName: "chat_message_read_receipts.message_id:chat_messages.id",
		}),
		reader: one(usersTable, {
			fields: [chatMessageReadReceiptsTable.readerId],
			references: [usersTable.id],
			relationName: "chat_message_read_receipts.reader_id:users.id",
		}),
	}),
);
