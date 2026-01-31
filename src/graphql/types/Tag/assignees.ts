import { and, asc, desc, eq, exists, gt, lt, or, type SQL } from "drizzle-orm";
import { z } from "zod";
// FIX 1: Remove 'tagAssignmentsTableInsertSchema' from this import
import { tagAssignmentsTable } from "~/src/drizzle/tables/tagAssignments";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Tag } from "./Tag";

// FIX 2: We define the cursor schema manually here to break the circular dependency.
// Instead of importing the schema (which causes the crash), we just recreate the small part we need.
const cursorSchema = z
	.object({
		assigneeId: z.string().uuid(),
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		assigneeId: arg.assigneeId,
		createdAt: new Date(arg.createdAt),
	}));

const assigneesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

Tag.implement({
	fields: (t) => ({
		assignees: t.connection(
			{
				description:
					"GraphQL connection to traverse through the users that are assignees of the tag.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = assigneesArgumentsSchema.safeParse(args);

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
						? [
								asc(tagAssignmentsTable.createdAt),
								asc(tagAssignmentsTable.assigneeId),
							]
						: [
								desc(tagAssignmentsTable.createdAt),
								desc(tagAssignmentsTable.assigneeId),
							];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(tagAssignmentsTable)
										.where(
											and(
												eq(tagAssignmentsTable.assigneeId, cursor.assigneeId),
												eq(tagAssignmentsTable.createdAt, cursor.createdAt),
												eq(tagAssignmentsTable.tagId, parent.id),
											),
										),
								),
								eq(tagAssignmentsTable.tagId, parent.id),
								or(
									and(
										eq(tagAssignmentsTable.createdAt, cursor.createdAt),
										gt(tagAssignmentsTable.assigneeId, cursor.assigneeId),
									),
									gt(tagAssignmentsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(tagAssignmentsTable.tagId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(tagAssignmentsTable)
										.where(
											and(
												eq(tagAssignmentsTable.assigneeId, cursor.assigneeId),
												eq(tagAssignmentsTable.createdAt, cursor.createdAt),
												eq(tagAssignmentsTable.tagId, parent.id),
											),
										),
								),
								eq(tagAssignmentsTable.tagId, parent.id),
								or(
									and(
										eq(tagAssignmentsTable.createdAt, cursor.createdAt),
										lt(tagAssignmentsTable.assigneeId, cursor.assigneeId),
									),
									lt(tagAssignmentsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(tagAssignmentsTable.tagId, parent.id);
						}
					}

					const tagAssignments =
						await ctx.drizzleClient.query.tagAssignmentsTable.findMany({
							columns: {
								assigneeId: true,
								createdAt: true,
							},
							limit,
							orderBy,
							with: {
								assignee: true,
							},
							where,
						});

					if (cursor !== undefined && tagAssignments.length === 0) {
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
						createCursor: (assignment) => ({
							assigneeId: assignment.assigneeId,
							createdAt: assignment.createdAt,
						}),
						createNode: (assignment) => assignment.assignee,
						parsedArgs,
						rawNodes: tagAssignments,
					});
				},
				type: User,
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
