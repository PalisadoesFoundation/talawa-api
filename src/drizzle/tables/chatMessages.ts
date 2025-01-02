import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { chatsTable } from "./chats";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for chat messages.
 */
export const chatMessagesTable = pgTable(
	"chat_messages",
	{
		/**
		 * Body of the chat message.
		 */
		body: text("body").notNull(),
		/**
		 * Foreign key reference to the id of the chat the chat message is associated to.
		 */
		chatId: uuid("chat_id")
			.notNull()
			.references(() => chatsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the chat message was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the chat message.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the chat message.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Foreign key reference to the id of the chat message the chat message is associated to.
		 */
		parentMessageId: uuid("parent_message_id").references(
			(): AnyPgColumn => chatMessagesTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),
		/**
		 * Date time at the time the chat message was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
	},
	(self) => [
		index().on(self.chatId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.parentMessageId),
	],
);

export const chatMessagesTableRelations = relations(
	chatMessagesTable,
	({ many, one }) => ({
		/**
		 * Many to one relationship from `chat_messages` table to `chats` table.
		 */
		chat: one(chatsTable, {
			fields: [chatMessagesTable.chatId],
			references: [chatsTable.id],
			relationName: "chat_messages.chat_id:chats.id",
		}),
		/**
		 * One to many relationship from `chat_messages` table to `chat_messages` table.
		 */
		chatMessagesWhereParentMessage: many(chatMessagesTable, {
			relationName: "chat_messages.id:chat_messages.parent_message_id",
		}),
		/**
		 * Many to one relationship from `chat_messages` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [chatMessagesTable.creatorId],
			references: [usersTable.id],
			relationName: "chat_messages.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `chat_messages` table to `chat_messages` table.
		 */
		parentMessage: one(chatMessagesTable, {
			fields: [chatMessagesTable.parentMessageId],
			references: [chatMessagesTable.id],
			relationName: "chat_messages.id:chat_messages.parent_message_id",
		}),
	}),
);

export const chatMessagesTableInsertSchema = createInsertSchema(
	chatMessagesTable,
	{
		body: (schema) => schema.min(1).max(2048),
	},
);
