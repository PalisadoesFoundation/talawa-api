import { Buffer } from "node:buffer";
import { and, asc, desc, eq, exists, gt, lt, type SQL } from "drizzle-orm";
import type { z } from "zod";
import {
	actionItemCategoriesTable,
	actionItemCategoriesTableInsertSchema,
} from "~/src/drizzle/tables/actionItemCategories";
import type { GraphQLContext } from "~/src/graphql/context";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Organization as OrganizationType } from "./Organization";
import { Organization } from "./Organization";

const actionItemCategoriesArgumentsSchema =
	defaultGraphQLConnectionArgumentsSchema
		.transform(transformDefaultGraphQLConnectionArguments)
		.transform((arg, ctx) => {
			let cursor: z.infer<typeof cursorSchema> | undefined;

			try {
				if (arg.cursor !== undefined) {
					cursor = cursorSchema.parse(
						JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
					);
				}
			} catch (_error) {
				ctx.addIssue({
					code: "custom",
					message: "Not a valid cursor.",
					path: [arg.isInversed ? "before" : "after"],
				});
			}

			return {
				cursor,
				isInversed: arg.isInversed,
				limit: arg.limit,
			};
		});

const cursorSchema = actionItemCategoriesTableInsertSchema.pick({
	name: true,
});

type ActionItemCategoriesArgs = z.input<
	typeof defaultGraphQLConnectionArgumentsSchema
>;

// Export the resolver function so it can be tested
export const resolveActionItemCategories = async (
	parent: OrganizationType,
	args: ActionItemCategoriesArgs,
	ctx: GraphQLContext,
) => {
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
	} = actionItemCategoriesArgumentsSchema.safeParse(args);

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

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.id),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	const { cursor, isInversed, limit } = parsedArgs;

	const orderBy = isInversed
		? [desc(actionItemCategoriesTable.name)]
		: [asc(actionItemCategoriesTable.name)];

	let where: SQL | undefined;

	if (isInversed) {
		if (cursor !== undefined) {
			where = and(
				exists(
					ctx.drizzleClient
						.select()
						.from(actionItemCategoriesTable)
						.where(
							and(
								eq(actionItemCategoriesTable.name, cursor.name),
								eq(actionItemCategoriesTable.organizationId, parent.id),
							),
						),
				),
				eq(actionItemCategoriesTable.organizationId, parent.id),
				lt(actionItemCategoriesTable.name, cursor.name),
			);
		} else {
			where = eq(actionItemCategoriesTable.organizationId, parent.id);
		}
	} else {
		if (cursor !== undefined) {
			where = and(
				exists(
					ctx.drizzleClient
						.select()
						.from(actionItemCategoriesTable)
						.where(
							and(
								eq(actionItemCategoriesTable.name, cursor.name),
								eq(actionItemCategoriesTable.organizationId, parent.id),
							),
						),
				),
				eq(actionItemCategoriesTable.organizationId, parent.id),
				gt(actionItemCategoriesTable.name, cursor.name),
			);
		} else {
			where = eq(actionItemCategoriesTable.organizationId, parent.id);
		}
	}

	const actionItemCategories =
		await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
			limit,
			orderBy,
			where,
		});

	if (cursor !== undefined && actionItemCategories.length === 0) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: [isInversed ? "before" : "after"],
					},
				],
			},
		});
	}

	return transformToDefaultGraphQLConnection({
		createCursor: (actionItemCategory) =>
			Buffer.from(
				JSON.stringify({
					name: actionItemCategory.name,
				}),
			).toString("base64url"),
		createNode: (actionItemCategory) => actionItemCategory,
		parsedArgs,
		rawNodes: actionItemCategories,
	});
};

Organization.implement({
	fields: (t) => ({
		actionItemCategories: t.connection(
			{
				description:
					"GraphQL connection to traverse through the action item categories belonging to the organization.",
				resolve: resolveActionItemCategories,
				type: ActionItemCategory,
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
			},
			{
				edgesField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
			{
				nodeField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
		),
	}),
});
