import { builder } from "~/src/graphql/builder";
import {
	QueryActionCategoriesByOrganizationInput,
	queryActionCategoriesByOrganizationArgumentsSchema,
} from "~/src/graphql/inputs/QueryActionCategoriesByOrganizationInput";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * GraphQL Query: Fetches all Action Item Categories by organizationId.
 */
export const actionCategoriesByOrganization = builder.queryField(
	"actionCategoriesByOrganization",
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
				// 1. Authentication check
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				// 2. Input validation using shared Zod schema
				const {
					data: parsedArgs,
					error,
					success,
				} = queryActionCategoriesByOrganizationArgumentsSchema.safeParse(args);

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

				// 3. Authorization and data fetch
				const [currentUser, actionCategories] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: { role: true },
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
						where: (fields, operators) =>
							operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							),
					}),
				]);

				if (!currentUser) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				const organizationExists =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.organizationId),
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

				return actionCategories ?? [];
			},
		}),
);
