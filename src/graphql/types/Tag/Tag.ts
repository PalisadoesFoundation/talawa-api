import type { tagsTable } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";

export type Tag = typeof tagsTable.$inferSelect;

export const Tag = builder.objectRef<Tag>("Tag");

Tag.implement({
	description: "",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the tag.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the tag.",
		}),
	}),
});
