import type { InferSelectModel } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
		description: t.exposeString("description", {
			description: "The description of the action item category.",
			nullable: true,
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
				type: builder.inputType("CategoriesByIdsInput", {
					fields: (t) => ({
						ids: t.field({
							type: ["ID"],
							required: false,
						}),
					}),
				}),
				required: true,
			}),
		},
		description: "Fetch multiple action item categories by their IDs.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.UNAUTHENTICATED,
					},
				});
			}

			const parsedArgs = categoriesByIdsInputSchema.safeParse(args.input);
			if (!parsedArgs.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.INVALID_ARGUMENTS,
						issues: parsedArgs.error.issues.map((issue) => ({
							argumentPath: issue.path.map(String),
							message: issue.message,
						})),
					},
				});
			}

			const categoryIds = parsedArgs.data.ids;

			const categories =
				await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
					where: (fields, _operators) => inArray(fields.id, categoryIds),
				});

			// Check categories based on user's organization membership
			const distinctOrgIds = [
				...new Set(categories.map((c) => c.organizationId)),
			];

			if (distinctOrgIds.length > 0) {
				const userMemberships =
					await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
						columns: { organizationId: true },
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.memberId, ctx.currentClient.user?.id ?? ""),
								inArray(fields.organizationId, distinctOrgIds),
							),
					});

				const memberOrgIds = new Set(
					userMemberships.map((m) => m.organizationId),
				);

				const issues: { argumentPath: string[]; message: string }[] = [];

				for (const category of categories) {
					if (!memberOrgIds.has(category.organizationId)) {
						parsedArgs.data.ids.forEach((id, index) => {
							if (id === category.id) {
								issues.push({
									argumentPath: ["input", "ids", String(index)],
									message:
										"User does not have access to this action item category",
								});
							}
						});
					}
				}

				if (issues.length > 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues,
						},
					});
				}
			}

			return categories;
		},
	}),
);
