import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { commentVotesTable } from "./commentVotes";
import { postsTable } from "./posts";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for comments.
 */
export const commentsTable = pgTable(
	"comments",
	{
		/**
		 * Body of the comment.
		 */
		body: text("body").notNull(),
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
		 * Foreign key reference to the id of the user who created the comment.
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
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.postId),
	],
);

export const commentsTableRelations = relations(
	commentsTable,
	({ many, one }) => ({
		/**
		 * One to many relationship from `comments` table to `comment_votes` table.
		 */
		votesWhereComment: many(commentVotesTable, {
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
	}),
);

export const commentsTableInsertSchema = createInsertSchema(commentsTable, {
	body: (schema) => schema.min(1).max(2048),
});
