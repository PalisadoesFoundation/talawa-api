import {
	type SQL,
	and,
	asc,
	desc,
	eq,
	exists,
	gt,
	ilike,
	lt,
	or,
} from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	type ParsedDefaultGraphQLConnectionArgumentsWithWhere,
	createGraphQLConnectionWithWhereSchema,
	type defaultGraphQLConnectionArgumentsSchema,
	transformGraphQLConnectionArgumentsWithWhere,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

// Define the where schema for user filtering
const userWhereSchema = z
	.object({
		name: z.string().min(1).optional(),
	})
	.optional();

// Create a connection arguments schema with the where clause
const allUsersArgumentsSchema = createGraphQLConnectionWithWhereSchema(
	userWhereSchema,
).transform((arg, ctx) => {
	// First transform using the connection with where transformer
	const transformedArg = transformGraphQLConnectionArgumentsWithWhere(
		// Type assertion to match the expected type
		{ ...arg, where: arg.where || {} } as z.infer<
			typeof defaultGraphQLConnectionArgumentsSchema
		> & { where: unknown },
		ctx,
	);

	let cursor: z.infer<typeof cursorSchema> | undefined = undefined;
	try {
		if (transformedArg.cursor !== undefined) {
			cursor = cursorSchema.parse(
				JSON.parse(
					Buffer.from(transformedArg.cursor, "base64url").toString("utf-8"),
				),
			);
		}
	} catch (error) {
		ctx.addIssue({
			code: "custom",
			message: "Not a valid cursor.",
			path: [transformedArg.isInversed ? "before" : "after"],
		});
	}

	return {
		cursor,
		isInversed: transformedArg.isInversed,
		limit: transformedArg.limit,
		where: transformedArg.where || {}, // Default to empty object if where is undefined
	};
});

const cursorSchema = z
	.object({
		createdAt: z.string().datetime(),
		id: z.string().uuid(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		id: arg.id,
	}));

builder.queryField("allUsers", (t) =>
	t.connection({
		type: User,
		args: {
			where: t.arg({
				type: builder.inputType("QueryAllUsersWhereInput", {
					fields: (t) => ({
						name: t.string({ required: false }),
					}),
				}),
				required: false,
			}),
		},
		description: "Query field to read all Users.",
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
			} = allUsersArgumentsSchema.safeParse(args);

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
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			const { cursor, isInversed, limit, where } =
				parsedArgs as ParsedDefaultGraphQLConnectionArgumentsWithWhere<
					{ createdAt: Date; id: string },
					{ name?: string | null }
				>;

			const orderBy = isInversed
				? [asc(usersTable.createdAt), asc(usersTable.id)]
				: [desc(usersTable.createdAt), desc(usersTable.id)];

			let queryWhere: SQL | undefined;

			// Add name search condition if provided in where
			const nameCondition = where?.name
				? ilike(usersTable.name, `%${where.name}%`)
				: undefined;

			if (isInversed) {
				if (cursor !== undefined) {
					queryWhere = and(
						exists(
							ctx.drizzleClient
								.select()
								.from(usersTable)
								.where(
									and(
										eq(usersTable.createdAt, cursor.createdAt),
										eq(usersTable.id, cursor.id),
									),
								),
						),
						or(
							and(
								eq(usersTable.createdAt, cursor.createdAt),
								gt(usersTable.id, cursor.id),
							),
							gt(usersTable.createdAt, cursor.createdAt),
						),
						nameCondition,
					);
				} else {
					queryWhere = nameCondition;
				}
			} else {
				if (cursor !== undefined) {
					queryWhere = and(
						exists(
							ctx.drizzleClient
								.select()
								.from(usersTable)
								.where(
									and(
										eq(usersTable.createdAt, cursor.createdAt),
										eq(usersTable.id, cursor.id),
									),
								),
						),
						or(
							and(
								eq(usersTable.createdAt, cursor.createdAt),
								lt(usersTable.id, cursor.id),
							),
							lt(usersTable.createdAt, cursor.createdAt),
						),
						nameCondition,
					);
				} else {
					queryWhere = nameCondition;
				}
			}

			const users = await ctx.drizzleClient.query.usersTable.findMany({
				limit,
				orderBy,
				where: queryWhere,
			});

			if (cursor !== undefined && users.length === 0) {
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
				createCursor: (user) =>
					Buffer.from(
						JSON.stringify({
							createdAt: user.createdAt.toISOString(),
							id: user.id,
						}),
					).toString("base64url"),
				createNode: (user) => user,
				parsedArgs,
				rawNodes: users,
			});
		},
	}),
);
