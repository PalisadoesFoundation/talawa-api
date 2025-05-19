import type { tagFoldersTable } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";

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
		name: t.exposeString("name", {
			description: "Name of the tag folder.",
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Date time at the time the tag folder was last updated.",
			type: "DateTime",
		}),
	}),
});
