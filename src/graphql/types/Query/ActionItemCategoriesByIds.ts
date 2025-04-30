// src/graphql/queries/categoriesByIds.ts

import { inArray } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// 1️⃣ Zod schema for the input
const queryCategoriesByIdsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// 2️⃣ Register the GraphQL field
builder.queryField("categoriesByIds", (t) =>
	t.field({
		type: [ActionItemCategory],
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("QueryCategoriesByIdsInput", {
					fields: (t) => ({
						ids: t.field({ type: ["ID"], required: true }),
					}),
				}),
			}),
		},
		description: "Fetch multiple action-item categories by their IDs.",
		resolve: async (_parent, { input }, ctx): Promise<ActionItemCategory[]> => {
			// 🔐 Authentication
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// ✅ Validate arguments
			const parsed = queryCategoriesByIdsSchema.safeParse(input);
			if (!parsed.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsed.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}
			const ids = parsed.data.ids;

			// 📦 Fetch from the database
			const categories =
				await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
					where: (fields, op) => inArray(fields.id, ids),
				});

			// 🚫 Error if none found
			if (categories.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "ids"] }],
					},
				});
			}

			// 🎉 Return the results
			return categories;
		},
	}),
);
