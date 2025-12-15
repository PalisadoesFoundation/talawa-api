import type { tagFoldersTable } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";
import { escapeHTML } from "~/src/utilities/sanitizer";

export type TagFolder = typeof tagFoldersTable.$inferSelect;

export const TagFolder = builder.objectRef<TagFolder>("TagFolder");

TagFolder.implement({
	description:
		"Tag folders are a feature to conveniently manage tags belonging to organizations.",
	fields: (t) => ({
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the tag folder was created.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the tag folder.",
			nullable: false,
		}),
		name: t.string({
			description: "Name of the tag folder.",
			resolve: (parent) => escapeHTML(parent.name),
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Date time at the time the tag folder was last updated.",
			type: "DateTime",
		}),
	}),
});
