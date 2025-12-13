import type { commentsTable } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";
import { escapeHTML } from "~/src/utilities/sanitizer";

export type Comment = typeof commentsTable.$inferSelect;

export const Comment = builder.objectRef<Comment>("Comment");

Comment.implement({
	description: "Comments are written opinions or reactions by users on a post.",
	fields: (t) => ({
		body: t.string({
			description: "Body of the comment.",
			resolve: (parent) => escapeHTML(parent.body),
		}),
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the comment was created.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the comment.",
			nullable: false,
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Date time at the time the comment was last updated.",
			type: "DateTime",
		}),
	}),
});
