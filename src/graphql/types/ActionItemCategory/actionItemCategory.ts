import type { InferSelectModel } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
export type ActionItemCategory = InferSelectModel<
	typeof actionItemCategoriesTable
>;

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
		isDisabled: t.exposeBoolean("isDisabled", {
			description: "Indicates whether the action item category is disabled.",
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
				required: true,
				type: builder.inputType("CategoriesByIdsInput", {
					fields: (t) => ({
						ids: t.field({ type: ["ID"], required: true }),
					}),
				}),
			}),
		},
		description: "Fetch multiple action item categories by their IDs.",
		// note the explicit return type here
		resolve: async (_parent, args, ctx): Promise<ActionItemCategory[]> => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new Error("Unauthenticated");
			}

			const parsed = categoriesByIdsInputSchema.safeParse(args.input);
			if (!parsed.success) {
				throw new Error("Invalid arguments");
			}
			const ids = parsed.data.ids;

			// assert drizzleClient is defined, and cast result to our model type
			if (!ctx.drizzleClient) {
				throw new Error("Drizzle client is not initialized");
			}
			if (!ctx.drizzleClient?.query?.actionItemCategoriesTable) {
				throw new Error(
					"Drizzle client or actionItemCategoriesTable is not initialized",
				);
			}
			const categories =
				await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
					where: (fields, op) => inArray(fields.id, ids),
				});
			return categories as ActionItemCategory[];
		},
	}),
);
