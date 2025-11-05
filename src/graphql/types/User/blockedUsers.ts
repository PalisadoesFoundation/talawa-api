import { type SQL, and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "../Organization/Organization";

const blockedUsersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = z.object({
	createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
		message: "Invalid date format for createdAt",
	}),
	organizationId: z.string().uuid(),
});

User.implement({
	fields: (t) => ({
		orgsWhereUserIsBlocked: t.connection({
			description:
				"GraphQL connection to retrieve organizations where the user is blocked.",
			resolve: async (parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				if (ctx.currentClient.user.id !== parent.id) {
					throw new TalawaGraphQLError({
						extensions: { code: "forbidden_action" },
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
					? [asc(blockedUsersTable.createdAt), asc(blockedUsersTable.organizationId)]
					: [desc(blockedUsersTable.createdAt), desc(blockedUsersTable.organizationId)];

				let where: SQL | undefined;

				if (cursor !== undefined) {
					where = and(
						eq(blockedUsersTable.userId, parent.id),
						or(
							and(
								eq(blockedUsersTable.createdAt, new Date(cursor.createdAt)),
								isInversed
									? gt(blockedUsersTable.userId, cursor.organizationId)
									: lt(blockedUsersTable.userId, cursor.organizationId),
							),
							isInversed
								? gt(blockedUsersTable.createdAt, new Date(cursor.createdAt))
								: lt(blockedUsersTable.createdAt, new Date(cursor.createdAt)),
						),
					);
				} else {
					where = eq(blockedUsersTable.userId, parent.id);
				}

				const blockedUsers =
					await ctx.drizzleClient.query.blockedUsersTable.findMany({
						columns: {
							createdAt: true,
							organizationId: true,
							userId: true,
						},
						limit,
						orderBy,
						with: {
							organization: true,
						},
						where,
					});

				return transformToDefaultGraphQLConnection({
					createCursor: (blockedUser) =>
						Buffer.from(
							JSON.stringify({
								createdAt: blockedUser.createdAt.toISOString(),
								organizationId: blockedUser.organizationId,
							}),
						).toString("base64url"),
					createNode: (blockedUser) => blockedUser.organization,
					parsedArgs,
					rawNodes: blockedUsers,
				});
			},
			type: Organization,
		}),
	}),
});
