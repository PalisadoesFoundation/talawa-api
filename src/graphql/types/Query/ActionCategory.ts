import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * GraphQL Query Input Validation Schema (Zod)
 */

const queryActionCategoriesByOrganizationInputSchema = z.object({
	organizationId: z
		.string()
		.uuid({ message: "Invalid Organization ID format" }),
});

const QueryActionCategoriesByOrganizationInput = builder.inputType(
	"QueryActionCategoriesByOrganizationInput",
	{
		fields: (t) => ({
			organizationId: t.string({ required: true }),
		}),
	},
);

/**
 * GraphQL Query: Fetches all Action Item Categories by organizationId.
 */

export const actionCategoriesByOrganization = builder.queryField(
	"ActionItemsByOrganization",
	(t) =>
		t.field({
			args: {
				input: t.arg({
					description:
						"Input parameters to fetch action item categories by organizationId.",
					required: true,
					type: QueryActionCategoriesByOrganizationInput,
				}),
			},
			description:
				"Query field to fetch all action item categories linked to a specific organization.",
			type: [ActionItemCategory],
			resolve: async (_parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const {
					data: parsedArgs,
					error,
					success,
				} = queryActionCategoriesByOrganizationInputSchema.safeParse(
					args.input,
				);

				if (!success) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: error.issues.map((issue) => ({
								argumentPath: issue.path,
								message: issue.message,
							})),
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const [currentUser, actionCategories] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: { role: true },
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.actionCategoriesTable.findMany({
						where: (fields, operators) =>
							operators.eq(fields.organizationId, parsedArgs.organizationId),
					}),
				]);

				if (!currentUser) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const organizationExists =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.organizationId),
					});

				if (!organizationExists) {
					throw new TalawaGraphQLError({
						message: "Organization not found.",
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "organizationId"] }],
						},
					});
				}

				if (!actionCategories.length) {
					return [];
				}

				return actionCategories;
			},
		}),
);
