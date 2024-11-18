import { relations } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { commentVotesTable } from "./commentVotes";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const commentsTable = pgTable(
	"comments",
	{
		body: text("body").notNull(),

		commenterId: uuid("commenter_id").references(() => usersTable.id, {}),

		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		id: uuid("id").primaryKey().$default(uuidv7),

		parentCommentId: uuid("parent_comment_id").references(
			(): AnyPgColumn => commentsTable.id,
			{},
		),

		pinnedAt: timestamp("pinned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		pinnerId: uuid("pinner_id").references(() => usersTable.id, {}),

		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		index().on(self.commenterId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.parentCommentId),
		index().on(self.pinnedAt),
		index().on(self.postId),
	],
);

export const commentsTableRelations = relations(
	commentsTable,
	({ many, one }) => ({
		childCommentsWhereParentComment: many(commentsTable, {
			relationName: "comments.id:comments.parent_comment_id",
		}),

		commenter: one(usersTable, {
			fields: [commentsTable.commenterId],
			references: [usersTable.id],
			relationName: "comments.commenter_id:users.id",
		}),

		commentVotesWhereComment: many(commentVotesTable, {
			relationName: "comment_votes.comment_id:comments.id",
		}),

		creator: one(usersTable, {
			fields: [commentsTable.creatorId],
			references: [usersTable.id],
			relationName: "comments.creator_id:users.id",
		}),

		parentComment: one(commentsTable, {
			fields: [commentsTable.parentCommentId],
			references: [commentsTable.id],
			relationName: "comments.id:comments.parent_comment_id",
		}),

		pinner: one(usersTable, {
			fields: [commentsTable.pinnerId],
			references: [usersTable.id],
			relationName: "comments.pinner_id:users.id",
		}),

		post: one(postsTable, {
			fields: [commentsTable.postId],
			references: [postsTable.id],
			relationName: "comments.post_id:posts.id",
		}),

		updater: one(usersTable, {
			fields: [commentsTable.updaterId],
			references: [usersTable.id],
			relationName: "comments.updater_id:users.id",
		}),
	}),
);
