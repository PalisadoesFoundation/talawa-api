import { builder } from "~/src/graphql/builder";

/**
 * Represents a tag unassigned from a user.
 */
export const UnassignUserTag = builder.objectRef<{
	assigneeId: string;
	tagId: string;
}>("UnassignUserTag");
UnassignUserTag.implement({
	description: "Represents a tag unassigned from a user.",
	fields: (t) => ({
		assigneeId: t.exposeID("assigneeId", {
			description: "Unique identifier of the unassigned user.",
		}),
		tagId: t.exposeID("tagId", {
			description: "Global identifier of the tag.",
		}),
	}),
});
