import { builder } from "~/src/graphql/builder";

/**
 * Represents a user assigned to a tag by an organization.
 */
export const AssignUserTag = builder.objectRef<{
	assigneeId: string;
	tagId: string;
}>("AssignUserTag");

AssignUserTag.implement({
	description: "Represents a tag assigned to a user.",
	fields: (t) => ({
		assigneeId: t.exposeID("assigneeId", {
			description: "Unique identifier of the assigned user.",
		}),
		tagId: t.exposeID("tagId", {
			description: "Global identifier of the tag.",
		}),
	}),
});
