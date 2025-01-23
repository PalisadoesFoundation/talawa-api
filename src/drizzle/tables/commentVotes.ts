import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { commentVoteTypeEnum } from "~/src/drizzle/enums/commentVoteType";
import { commentsTable } from "./comments";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for comment votes.
 */
export const commentVotesTable = pgTable(
	"comment_votes",
	{
		/**
		 * Foreign key reference to the id of the comment which is voted.
		 */
		commentId: uuid("comment_id")
			.notNull()
			.references(() => commentsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the vote was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the vote.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the vote.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Type of the vote.
		 */
		type: text("type", {
			enum: commentVoteTypeEnum.options,
		}).notNull(),
		/**
		 * Date time at the time the vote was last updated.
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
		index().on(self.commentId),
		index().on(self.creatorId),
		index().on(self.type),
		uniqueIndex().on(self.commentId, self.creatorId),
	],
);

export const commentVotesTableRelations = relations(
	commentVotesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `comment_votes` table to `comments` table.
		 */
		comment: one(commentsTable, {
			fields: [commentVotesTable.commentId],
			references: [commentsTable.id],
			relationName: "comment_votes.comment_id:comments.id",
		}),
		/**
		 * Many to one relationship from `comment_votes` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [commentVotesTable.creatorId],
			references: [usersTable.id],
			relationName: "comment_votes.creator_id:users.id",
		}),
	}),
);

export const commentVotesTableInsertSchema =
	createInsertSchema(commentVotesTable);
