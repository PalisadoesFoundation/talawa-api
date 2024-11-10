import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { postVoteTypeEnum } from "~/src/drizzle/enums";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const postVotesTable = pgTable(
	"post_votes",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updated_id").references(() => usersTable.id),

		type: text("type", {
			enum: postVoteTypeEnum.options,
		}).notNull(),

		voterId: uuid("voter_id").references(() => usersTable.id),
	},
	(self) => ({
		compositePrimaryKey: primaryKey({
			columns: [self.postId, self.voterId],
		}),
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.postId),
		index3: index().on(self.type),
		index4: index().on(self.voterId),
	}),
);

export type PostVotePgType = InferSelectModel<typeof postVotesTable>;

export const postVotesTableRelations = relations(postVotesTable, ({ one }) => ({
	creator: one(usersTable, {
		fields: [postVotesTable.creatorId],
		references: [usersTable.id],
		relationName: "post_votes.creator_id:users.id",
	}),

	post: one(postsTable, {
		fields: [postVotesTable.postId],
		references: [postsTable.id],
		relationName: "post_votes.post_id:posts.id",
	}),

	updater: one(usersTable, {
		fields: [postVotesTable.updaterId],
		references: [usersTable.id],
		relationName: "post_votes.updater_id:users.id",
	}),

	voter: one(usersTable, {
		fields: [postVotesTable.voterId],
		references: [usersTable.id],
		relationName: "post_votes.voter_id:users.id",
	}),
}));
