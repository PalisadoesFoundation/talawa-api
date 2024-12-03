import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { commentVotesTable } from "./commentVotes";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const commentsTable = pgTable(
	"comments",
	{
		/**
		 * Body of the comment.
		 */
		body: text("body").notNull() /**
		 * Foreign key reference to the id of the user who made the comment.
		 */,
		commenterId: uuid("commenter_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Date time at the time the comment was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who first created the comment.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the comment.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean field to tell if the comment is pinned.
		 */
		isPinned: boolean("is_pinned").notNull(),
		/**
		 * Date time at the time the comment was pinned.
		 */
		pinnedAt: timestamp("pinned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Foreign key reference to the id of the post on which the comment is made.
		 */
		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the comment was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the comment.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.commenterId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.postId),
	],
);

export const commentsTableRelations = relations(
	commentsTable,
	({ many, one }) => ({
		/**
		 * Many to one relationship from `comments` table to `users` table.
		 */
		commenter: one(usersTable, {
			fields: [commentsTable.commenterId],
			references: [usersTable.id],
			relationName: "comments.commenter_id:users.id",
		}),
		/**
		 * One to many relationship from `comments` table to `comment_votes` table.
		 */
		commentVotesWhereComment: many(commentVotesTable, {
			relationName: "comment_votes.comment_id:comments.id",
		}),
		/**
		 * Many to one relationship from `comments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [commentsTable.creatorId],
			references: [usersTable.id],
			relationName: "comments.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `comments` table to `posts` table.
		 */
		post: one(postsTable, {
			fields: [commentsTable.postId],
			references: [postsTable.id],
			relationName: "comments.post_id:posts.id",
		}),
		/**
		 * Many to one relationship from `comments` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [commentsTable.updaterId],
			references: [usersTable.id],
			relationName: "comments.updater_id:users.id",
		}),
	}),
);

export const commentsTableInsertSchema = createInsertSchema(commentsTable, {
	body: (schema) => schema.body.min(1).max(2048),
});
