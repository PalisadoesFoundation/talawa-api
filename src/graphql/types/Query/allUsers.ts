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
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

// Extend the default connection arguments to include name search
const allUsersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.extend({
		name: z.string().min(1).optional().nullish(),
	})
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
			name: arg.name,
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
			name: t.arg.string({ required: false }),
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

			const { cursor, isInversed, limit, name } = parsedArgs;

			const orderBy = isInversed
				? [asc(usersTable.createdAt), asc(usersTable.id)]
				: [desc(usersTable.createdAt), desc(usersTable.id)];

			let where: SQL | undefined;

			// Add name search condition if provided
			const nameCondition = name
				? ilike(usersTable.name, `%${name}%`)
				: undefined;

			if (isInversed) {
				if (cursor !== undefined) {
					where = and(
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
					where = nameCondition;
				}
			} else {
				if (cursor !== undefined) {
					where = and(
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
					where = nameCondition;
				}
			}

			const users = await ctx.drizzleClient.query.usersTable.findMany({
				limit,
				orderBy,
				where,
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
