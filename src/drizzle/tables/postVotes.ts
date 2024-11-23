import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const postVotesTable = pgTable(
	"post_votes",
	{
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

		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updated_id").references(() => usersTable.id),

		type: postVoteTypeEnum("type").notNull(),

		voterId: uuid("voter_id").references(() => usersTable.id),
	},
	(self) => [
		primaryKey({
			columns: [self.postId, self.voterId],
		}),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.postId),
		index().on(self.type),
		index().on(self.voterId),
	],
);

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
