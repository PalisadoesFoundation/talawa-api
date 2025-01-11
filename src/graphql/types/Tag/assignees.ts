import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	tagAssignmentsTable,
	tagAssignmentsTableInsertSchema,
} from "~/src/drizzle/tables/tagAssignments";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Tag } from "./Tag";

const assigneesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = tagAssignmentsTableInsertSchema
	.pick({
		assigneeId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		assigneeId: arg.assigneeId,
		createdAt: new Date(arg.createdAt),
	}));

Tag.implement({
	fields: (t) => ({
		assignees: t.connection(
			{
				description:
					"GraphQL connection to traverse through the users that are assignees of the tag.",
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
						createCursor: (assignment) =>
							Buffer.from(
								JSON.stringify({
									assigneeId: assignment.assigneeId,
									createdAt: assignment.createdAt.toISOString(),
								}),
							).toString("base64url"),
						createNode: (assignment) => assignment.assignee,
						parsedArgs,
						rawNodes: tagAssignments,
					});
				},
				type: User,
			},
			{
				description: "",
			},
			{
				description: "",
			},
		),
	}),
});
