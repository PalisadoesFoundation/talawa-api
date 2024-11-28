import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { commmentVoteTypeEnum } from "~/src/drizzle/enums/commentVoteType";
import { commentsTable } from "./comments";
import { usersTable } from "./users";

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
		 * Foreign key reference to the id of the user who first created the vote.
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
		type: commmentVoteTypeEnum("type").notNull(),
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
		/**
		 * Foreign key reference to the id of the user who last updated the vote.
		 */
		updaterId: uuid("updated_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}) /**
		 * Foreign key reference to the id of the user who voted.
		 */,
		voterId: uuid("voter_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.commentId),
		index().on(self.creatorId),
		index().on(self.type),
		index().on(self.voterId),
		uniqueIndex().on(self.commentId, self.voterId),
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
		/**
		 * Many to one relationship from `comment_votes` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [commentVotesTable.updaterId],
			references: [usersTable.id],
			relationName: "comment_votes.updater_id:users.id",
		}),
		/**
		 * Many to one relationship from `comment_votes` table to `users` table.
		 */
		voter: one(usersTable, {
			fields: [commentVotesTable.voterId],
			references: [usersTable.id],
			relationName: "comment_votes.voter_id:users.id",
		}),
	}),
);

export const commentVotesTableInsertSchema =
	createInsertSchema(commentVotesTable);
