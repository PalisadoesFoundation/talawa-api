import type { InferSelectModel } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import { builder } from "~/src/graphql/builder";
export type ActionItemCategory = InferSelectModel<typeof actionCategoriesTable>;

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
		creatorId: t.exposeID("creatorId", {
			description: "Identifier for the user who created this category.",
		}),
		isDisabled: t.exposeBoolean("isDisabled", {
			description: "Indicates whether the action item category is disabled.",
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

const categoriesByIdsInputSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

builder.queryField("categoriesByIds", (t) =>
	t.field({
		type: [ActionItemCategory],
		args: {
			input: t.arg({
				type: builder.inputType("CategoriesByIdsInput", {
					fields: (t) => ({
						ids: t.field({
							type: ["ID"],
							required: true,
						}),
					}),
				}),
				required: true,
			}),
		},
		description: "Fetch multiple action item categories by their IDs.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new Error("Unauthenticated");
			}

			const parsedArgs = categoriesByIdsInputSchema.safeParse(args.input);
			if (!parsedArgs.success) {
				throw new Error("Invalid arguments");
			}

			const categoryIds = parsedArgs.data.ids;

			const categories =
				await ctx.drizzleClient.query.actionCategoriesTable.findMany({
					where: (fields, operators) => inArray(fields.id, categoryIds),
				});

			return categories;
		},
	}),
);
