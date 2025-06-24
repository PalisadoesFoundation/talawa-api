import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import type { z } from "zod";
import {
	actionsTable,
	actionsTableInsertSchema,
} from "~/src/drizzle/tables/actions";
import type { GraphQLContext } from "~/src/graphql/context";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import envConfig from "~/src/utilities/graphqLimits";
import { ActionItemCategory } from "./ActionItemCategory";
import type { ActionItemCategory as ActionItemCategoryType } from "./ActionItemCategory";

const actionItemsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined = undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (error) {
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

const cursorSchema = actionsTableInsertSchema
	.pick({
		assignedAt: true,
	})
	.extend({
		id: actionsTableInsertSchema.shape.id.unwrap(),
	});

type ActionItemsArgs = z.input<typeof defaultGraphQLConnectionArgumentsSchema>;

// Export the resolver function so it can be tested
export const resolveActionItems = async (
	parent: ActionItemCategoryType,
	args: ActionItemsArgs,
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
	} = actionItemsArgumentsSchema.safeParse(args);

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

	const { cursor, isInversed, limit } = parsedArgs;

	const orderBy = isInversed
		? [desc(actionsTable.assignedAt), desc(actionsTable.id)]
		: [asc(actionsTable.assignedAt), asc(actionsTable.id)];

	let where: SQL | undefined;

	if (isInversed) {
		if (cursor !== undefined) {
			where = and(
				exists(
					ctx.drizzleClient
						.select()
						.from(actionsTable)
						.where(
							and(
								eq(actionsTable.categoryId, parent.id),
								eq(actionsTable.id, cursor.id),
								eq(actionsTable.assignedAt, cursor.assignedAt),
							),
						),
				),
				eq(actionsTable.categoryId, parent.id),
				or(
					and(
						eq(actionsTable.assignedAt, cursor.assignedAt),
						lt(actionsTable.id, cursor.id),
					),
					lt(actionsTable.assignedAt, cursor.assignedAt),
				),
			);
		} else {
			where = eq(actionsTable.categoryId, parent.id);
		}
	} else {
		if (cursor !== undefined) {
			where = and(
				exists(
					ctx.drizzleClient
						.select()
						.from(actionsTable)
						.where(
							and(
								eq(actionsTable.categoryId, parent.id),
								eq(actionsTable.id, cursor.id),
								eq(actionsTable.assignedAt, cursor.assignedAt),
							),
						),
				),
				eq(actionsTable.categoryId, parent.id),
				or(
					and(
						eq(actionsTable.assignedAt, cursor.assignedAt),
						gt(actionsTable.id, cursor.id),
					),
					gt(actionsTable.assignedAt, cursor.assignedAt),
				),
			);
		} else {
			where = eq(actionsTable.categoryId, parent.id);
		}
	}

	const actionItems = await ctx.drizzleClient.query.actionsTable.findMany({
		limit,
		orderBy,
		where,
	});

	if (cursor !== undefined && actionItems.length === 0) {
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
		createCursor: (actionItem) =>
			Buffer.from(
				JSON.stringify({
					id: actionItem.id,
					assignedAt: actionItem.assignedAt,
				}),
			).toString("base64url"),
		createNode: (actionItem) => actionItem,
		parsedArgs,
		rawNodes: actionItems,
	});
};

ActionItemCategory.implement({
	fields: (t) => ({
		actionItems: t.connection(
			{
				description:
					"GraphQL connection to traverse through the action items that belong to this category.",
				resolve: resolveActionItems, // Use the exported function
				type: ActionItem,
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
