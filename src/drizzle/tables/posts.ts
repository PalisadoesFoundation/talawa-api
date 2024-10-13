import { type InferSelectModel, relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),

		pinnedAt: timestamp("pinned_at", {
			mode: "date",
		}),

		pinnerId: uuid("pinner_id").references(() => usersTable.id, {}),

		posterId: uuid("poster_id").references(() => usersTable.id, {}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.organizationId),
		index3: index().on(self.pinnedAt),
		index4: index().on(self.posterId),
	}),
);

export type PostPgType = InferSelectModel<typeof postsTable>;

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
