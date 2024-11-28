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
import { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const postVotesTable = pgTable(
	"post_votes",
	{
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
		 * Foreign key reference to the id of the post which is voted.
		 */
		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Type of the vote.
		 */
		type: postVoteTypeEnum("type").notNull(),
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
		}),
		/**
		 * Foreign key reference to the id of the user who voted.
		 */
		voterId: uuid("voter_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.creatorId),
		index().on(self.postId),
		index().on(self.type),
		index().on(self.voterId),
		uniqueIndex().on(self.postId, self.voterId),
	],
);

export const postVotesTableRelations = relations(postVotesTable, ({ one }) => ({
	/**
	 * Many to one relationship from `post_votes` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [postVotesTable.creatorId],
		references: [usersTable.id],
		relationName: "post_votes.creator_id:users.id",
	}),
	/**
	 * Many to one relationship from `post_votes` table to `posts` table.
	 */
	post: one(postsTable, {
		fields: [postVotesTable.postId],
		references: [postsTable.id],
		relationName: "post_votes.post_id:posts.id",
	}),
	/**
	 * Many to one relationship from `post_votes` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [postVotesTable.updaterId],
		references: [usersTable.id],
		relationName: "post_votes.updater_id:users.id",
	}),
	/**
	 * Many to one relationship from `post_votes` table to `users` table.
	 */
	voter: one(usersTable, {
		fields: [postVotesTable.voterId],
		references: [usersTable.id],
		relationName: "post_votes.voter_id:users.id",
	}),
}));

export const postVotesTableInsertSchema = createInsertSchema(postVotesTable);
