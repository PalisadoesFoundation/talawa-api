// src/graphql/queries/categoriesByIds.ts

import { inArray } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

//  Zod schema for validating the input argument structure (expects non-empty array of UUIDs)
const queryCategoriesByIdsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

//  Define and register the `categoriesByIds` GraphQL query field
builder.queryField("categoriesByIds", (t) =>
	t.field({
		// Return type is an array of ActionItemCategory objects
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
			//  Ensure user is authenticated before proceeding
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			//  Validate input against the Zod schema
			const parsed = queryCategoriesByIdsSchema.safeParse(input);
			if (!parsed.success) {
				// Return structured validation errors
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

			//  Query the database for categories matching the given IDs
			const categories =
				await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
					where: (fields, op) => inArray(fields.id, ids),
				});

			//  If no categories were found, throw a not-found error
			if (categories.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "ids"] }],
					},
				});
			}

			//  Return the found categories
			return categories;
		},
	}),
);
