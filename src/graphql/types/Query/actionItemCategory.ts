import { sql } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryActionItemCategoryInputSchema = z.object({
	id: z.string().uuid(),
});

const QueryActionItemCategoryInput = builder.inputType(
	"QueryActionItemCategoryInput",
	{
		fields: (t) => ({
			id: t.string({ required: true }),
		}),
	},
);

builder.queryField("actionItemCategory", (t) =>
	t.field({
		type: ActionItemCategory,
		nullable: true,
		args: {
			input: t.arg({
				type: QueryActionItemCategoryInput,
				required: true,
			}),
		},
		description: "Query field to fetch a single action item category by ID.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = queryActionItemCategoryInputSchema.parse(args.input);

			const category =
				await ctx.drizzleClient.query.actionCategoriesTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, parsedArgs.id),
				});

			if (!category) {
				return null;
			}

			// Check if user has access to this organization
			const userMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						sql`${operators.eq(
							fields.memberId,
							ctx.currentClient.user!.id,
						)} AND ${operators.eq(
							fields.organizationId,
							category.organizationId,
						)}`,
				});

			if (!userMembership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"User does not have access to this action item category",
							},
						],
					},
				});
			}

			return category;
		},
	}),
);
