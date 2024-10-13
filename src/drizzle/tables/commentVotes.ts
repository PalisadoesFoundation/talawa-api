import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { commmentVoteTypeEnum } from "~/src/drizzle/enums";
import { commentsTable } from "./comments";
import { usersTable } from "./users";

export const commentVotesTable = pgTable(
	"comment_votes",
	{
		commentId: uuid("comment_id")
			.notNull()
			.references(() => commentsTable.id, {}),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		type: text("type", {
			enum: commmentVoteTypeEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updated_id").references(() => usersTable.id),

		voterId: uuid("voter_id").references(() => usersTable.id),
	},
	(self) => ({
		compositePrimaryKey: primaryKey({
			columns: [self.commentId, self.voterId],
		}),
		index0: index().on(self.commentId),
		index1: index().on(self.createdAt),
		index2: index().on(self.creatorId),
		index3: index().on(self.type),
		index4: index().on(self.voterId),
	}),
);

export type CommentVotePgType = InferSelectModel<typeof commentVotesTable>;

export const commentVotesTableRelations = relations(
	commentVotesTable,
	({ one }) => ({
		comment: one(commentsTable, {
			fields: [commentVotesTable.commentId],
			references: [commentsTable.id],
			relationName: "comment_votes.comment_id:comments.id",
		}),

		creator: one(usersTable, {
			fields: [commentVotesTable.creatorId],
			references: [usersTable.id],
			relationName: "comment_votes.creator_id:users.id",
		}),

		updater: one(usersTable, {
			fields: [commentVotesTable.updaterId],
			references: [usersTable.id],
			relationName: "comment_votes.updater_id:users.id",
		}),

		voter: one(usersTable, {
			fields: [commentVotesTable.voterId],
			references: [usersTable.id],
			relationName: "comment_votes.voter_id:users.id",
		}),
	}),
);
