import { type InferSelectModel, relations } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
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
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		parentCommentId: uuid("parent_comment_id").references(
			(): AnyPgColumn => commentsTable.id,
			{},
		),

		pinnedAt: timestamp("pinned_at", {
			mode: "date",
		}),

		pinnerId: uuid("pinner_id").references(() => usersTable.id, {}),

		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		index0: index().on(self.commenterId),
		index1: index().on(self.createdAt),
		index2: index().on(self.creatorId),
		index3: index().on(self.parentCommentId),
		index4: index().on(self.pinnedAt),
		index5: index().on(self.postId),
	}),
);

export type CommentPgType = InferSelectModel<typeof commentsTable>;

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
