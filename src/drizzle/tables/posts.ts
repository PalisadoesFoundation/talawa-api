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
import { commentsTable } from "./comments";
import { organizationsTable } from "./organizations";
import { postAttachmentsTable } from "./postAttachments";
import { postVotesTable } from "./postVotes";
import { usersTable } from "./users";

export const postsTable = pgTable(
	"posts",
	{
		/**
		 * Caption of the post.
		 */
		caption: text("caption").notNull(),
		/**
		 * Date time at the time the post was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who first created the post.
		 */
		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),
		/**
		 * Primary unique identifier of the post.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean field to tell if the post is pinned.
		 */
		isPinned: boolean("is_pinned").notNull(),
		/**
		 * Foreign key reference to the id of the organization in which the post is made.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),
		/**
		 * Date time at the time the post was pinned.
		 */
		pinnedAt: timestamp("pinned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Foreign key reference to the id of the user who made the post.
		 */
		posterId: uuid("poster_id").references(() => usersTable.id, {}),
		/**
		 * Date time at the time the post was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the post.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.organizationId),
		index().on(self.posterId),
	],
);

export const postsTableRelations = relations(postsTable, ({ many, one }) => ({
	/**
	 * One to many relationship from `posts` table to `comments` table.
	 */
	commentsWherePost: many(commentsTable, {
		relationName: "comments.post_id:posts.id",
	}),
	/**
	 * Many to one relationship from `posts` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [postsTable.creatorId],
		references: [usersTable.id],
		relationName: "posts.creator_id:users.id",
	}),
	/**
	 * Many to one relationship from `posts` table to `organizations` table.
	 */
	organization: one(organizationsTable, {
		fields: [postsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "organizations.id:posts.organization_id",
	}),
	/**
	 * Many to one relationship from `posts` table to `users` table.
	 */
	poster: one(usersTable, {
		fields: [postsTable.posterId],
		references: [usersTable.id],
		relationName: "posts.poster_id:users.id",
	}),
	/**
	 * One to many relationship from `posts` table to `post_attachments` table.
	 */
	postAttachmentsWherePost: many(postAttachmentsTable, {
		relationName: "post_attachments.post_id:posts.id",
	}),
	/**
	 * One to many relationship from `posts` table to `post_votes` table.
	 */
	postVotesWherePost: many(postVotesTable, {
		relationName: "post_votes.post_id:posts.id",
	}),
	/**
	 * Many to one relationship from `posts` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [postsTable.updaterId],
		references: [usersTable.id],
		relationName: "posts.updater_id:users.id",
	}),
}));

export const postsTableInsertSchema = createInsertSchema(postsTable, {
	caption: (schema) => schema.caption.min(1).max(2048),
});
