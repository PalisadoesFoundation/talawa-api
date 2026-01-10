import { and, asc, desc, eq, gt, lt, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import { User } from "~/src/graphql/types/User/User";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

const blockedUsersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = z.object({
	createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
		message: "Invalid date format for createdAt",
	}),
	userId: z.string().uuid(),
});

Organization.implement({
	fields: (t) => ({
		blockedUsers: t.connection({
			description:
				"GraphQL connection to retrieve blocked users of the organization.",
			resolve: async (parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				const {
					data: parsedArgs,
					error,
					success,
				} = blockedUsersArgumentsSchema.safeParse(args);
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
					? [asc(blockedUsersTable.createdAt), asc(blockedUsersTable.userId)]
					: [desc(blockedUsersTable.createdAt), desc(blockedUsersTable.userId)];

				let where: SQL | undefined;

				if (cursor !== undefined) {
					where = and(
						eq(blockedUsersTable.organizationId, parent.id),
						or(
							and(
								eq(blockedUsersTable.createdAt, new Date(cursor.createdAt)),
								isInversed
									? gt(blockedUsersTable.userId, cursor.userId)
									: lt(blockedUsersTable.userId, cursor.userId),
							),
							isInversed
								? gt(blockedUsersTable.createdAt, new Date(cursor.createdAt))
								: lt(blockedUsersTable.createdAt, new Date(cursor.createdAt)),
						),
					);
				} else {
					where = eq(blockedUsersTable.organizationId, parent.id);
				}

				const blockedUsers =
					await ctx.drizzleClient.query.blockedUsersTable.findMany({
						columns: {
							createdAt: true,
							userId: true,
						},
						limit,
						orderBy,
						with: {
							user: true,
						},
						where,
					});

				if (cursor !== undefined && blockedUsers.length === 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: [isInversed ? "before" : "after"] }],
						},
					});
				}

				return transformToDefaultGraphQLConnection({
					createCursor: (blockedUser) => ({
						createdAt: blockedUser.createdAt.toISOString(),
						userId: blockedUser.userId,
					}),
					createNode: (blockedUser) => blockedUser.user,
					parsedArgs,
					rawNodes: blockedUsers,
				});
			},
			type: User,
		}),
	}),
});
