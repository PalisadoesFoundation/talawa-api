import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { commentsTable } from "./comments";
import { organizationsTable } from "./organizations";
import { postAttachmentsTable } from "./postAttachments";
import { postVotesTable } from "./postVotes";
import { usersTable } from "./users";

export const postsTable = pgTable(
	"posts",
	{
		caption: text("caption").notNull(),

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

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),

		pinnedAt: timestamp("pinned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		pinnerId: uuid("pinner_id").references(() => usersTable.id, {}),

		posterId: uuid("poster_id").references(() => usersTable.id, {}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.organizationId),
		index().on(self.pinnedAt),
		index().on(self.posterId),
	],
);

export const postsTableRelations = relations(postsTable, ({ many, one }) => ({
	commentsWherePost: many(commentsTable, {
		relationName: "comments.post_id:posts.id",
	}),

	creator: one(usersTable, {
		fields: [postsTable.creatorId],
		references: [usersTable.id],
		relationName: "posts.creator_id:users.id",
	}),

	organization: one(organizationsTable, {
		fields: [postsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "organizations.id:posts.organization_id",
	}),

	pinner: one(usersTable, {
		fields: [postsTable.pinnerId],
		references: [usersTable.id],
		relationName: "posts.pinner_id:users.id",
	}),

	poster: one(usersTable, {
		fields: [postsTable.posterId],
		references: [usersTable.id],
		relationName: "posts.poster_id:users.id",
	}),

	postAttachmentsWherePost: many(postAttachmentsTable, {
		relationName: "post_attachments.post_id:posts.id",
	}),

	postVotesWherePost: many(postVotesTable, {
		relationName: "post_votes.post_id:posts.id",
	}),

	updater: one(usersTable, {
		fields: [postsTable.updaterId],
		references: [usersTable.id],
		relationName: "posts.updater_id:users.id",
	}),
}));
