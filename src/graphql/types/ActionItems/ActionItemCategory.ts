import { builder } from "~/src/graphql/builder";

export type ActionItemCategory = {
	id: string;
	name: string;
	organizationId: string;
	isDisabled: boolean;
	creatorId: string;
	createdAt: Date;
	updatedAt: Date;
};

export const ActionItemCategory =
	builder.objectRef<ActionItemCategory>("ActionItemCategory");

ActionItemCategory.implement({
	description:
		"Represents a category for action items, including metadata such as creation and update timestamps.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Unique identifier for the action item category.",
		}),
		name: t.exposeString("name", {
			description: "The name of the action item category.",
		}),
		organizationId: t.exposeID("organizationId", {
			description: "Identifier for the organization this category belongs to.",
		}),
		isDisabled: t.exposeBoolean("isDisabled", {
			description: "Indicates whether the action item category is disabled.",
		}),
		creatorId: t.exposeID("creatorId", {
			description: "Identifier for the user who created this category.",
		}),
		createdAt: t.expose("createdAt", {
			description: "Timestamp when the category was created.",
			type: "DateTime",
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Timestamp when the category was last updated.",
			type: "DateTime",
		}),
	}),
});
