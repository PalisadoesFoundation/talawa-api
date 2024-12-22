import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import { chatsTable } from "./chats";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for chat memberships.
 */
export const chatMembershipsTable = pgTable(
	"chat_memberships",
	{
		/**
		 * Date time at the time the chat membership was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the chat membership.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the chat the membership is associated to.
		 */
		chatId: uuid("chat_id")
			.notNull()
			.references(() => chatsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key reference to the id of the user the membership is associated to.
		 */
		memberId: uuid("member_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Role assigned to the user within the chat.
		 */
		role: text("role", {
			enum: chatMembershipRoleEnum.options,
		}).notNull(),
		/**
		 * Date time at the time the chat membership was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the chat membership.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.chatId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.memberId),
		index().on(self.role),
		primaryKey({
			columns: [self.chatId, self.memberId],
		}),
	],
);

export const chatMembershipsTableRelations = relations(
	chatMembershipsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `chat_memberships` table to `chats` table.
		 */
		chat: one(chatsTable, {
			fields: [chatMembershipsTable.chatId],
			references: [chatsTable.id],
			relationName: "chat_memberships.chat_id:chats.id",
		}),
		/**
		 * Many to one relationship from `chat_memberships` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [chatMembershipsTable.creatorId],
			references: [usersTable.id],
			relationName: "chat_memberships.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `chat_memberships` table to `users` table.
		 */
		member: one(usersTable, {
			fields: [chatMembershipsTable.memberId],
			references: [usersTable.id],
			relationName: "chat_memberships.member_id:users.id",
		}),
		/**
		 * Many to one relationship from `chat_memberships` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [chatMembershipsTable.updaterId],
			references: [usersTable.id],
			relationName: "chat_memberships.updater_id:users.id",
		}),
	}),
);

export const chatMembershipsTableInsertSchema =
	createInsertSchema(chatMembershipsTable);
