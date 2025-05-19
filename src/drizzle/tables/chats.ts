import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { chatMembershipsTable } from "./chatMemberships";
import { chatMessagesTable } from "./chatMessages";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for chats.
 */
export const chatsTable = pgTable(
	"chats",
	{
		/**
		 * Mime type of the avatar of the chat.
		 */
		avatarMimeType: text("avatar_mime_type", {
			enum: imageMimeTypeEnum.options,
		}),
		/**
		 * Primary unique identifier of the chat's avatar.
		 */
		avatarName: text("avatar_name"),
		/**
		 * Date time at the time the chat was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the chat.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Custom information about the chat.
		 */
		description: text("description"),
		/**
		 * Primary unique identifier of the chat.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Name of the chat.
		 */
		name: text("name", {}).notNull().unique(),
		/**
		 * Foreign key reference to the id of the organization associated to the chat.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the chat was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the chat.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.organizationId),
		index().on(self.updaterId),
	],
);

export const chatsTableRelations = relations(chatsTable, ({ one, many }) => ({
	/**
	 * Many to one relationship from `chats` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [chatsTable.creatorId],
		references: [usersTable.id],
		relationName: "chats.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `chats` table to `chat_memberships` table.
	 */
	chatMembershipsWhereChat: many(chatMembershipsTable, {
		relationName: "chat_memberships.chat_id:chats.id",
	}),
	/**
	 * One to many relationship from `chats` table to `chatMessages` table.
	 */
	chatMessagesWhereChat: many(chatMessagesTable, {
		relationName: "chat_messages.chat_id:chats.id",
	}),
	/**
	 * Many to one relationship from `chats` table to `organizations` table.
	 */
	organization: one(organizationsTable, {
		fields: [chatsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "chats.organization_id:organizations.id",
	}),
	/**
	 * Many to one relationship from `chats` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [chatsTable.updaterId],
		references: [usersTable.id],
		relationName: "chats.updater_id:users.id",
	}),
}));

export const chatsTableInsertSchema = createInsertSchema(chatsTable, {
	avatarName: (schema) => schema.min(1).optional(),
	description: (schema) => schema.min(1).max(2048).optional(),
	name: (schema) => schema.min(1).max(256),
});
