import { and, asc, desc, eq, gt, lt, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { BlockedUser } from "../BlockedUser/BlockedUser";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

const cursorSchema = z.object({
	createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
		message: "Invalid date format for createdAt",
	}),
	organizationId: z.string().uuid(),
});

const blockedUsersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursorObj: z.infer<typeof cursorSchema> | undefined;
		try {
			if (arg.cursor !== undefined) {
				cursorObj = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (error) {
			if (!(error instanceof Error)) {
				throw error;
			}
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}
		return {
			cursorData: cursorObj,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

export const resolveOrgsWhereUserIsBlocked = async (
	parent: User,
	args: Record<string, unknown>,
	ctx: ContextType,
): Promise<
	ReturnType<typeof transformToDefaultGraphQLConnection<unknown, BlockedUser>>
> => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: { role: true },
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	if (currentUser.role !== "administrator") {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
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

	const { cursorData, isInversed, limit } = parsedArgs;

	const orderBy = isInversed
		? [asc(blockedUsersTable.createdAt), asc(blockedUsersTable.organizationId)]
		: [
				desc(blockedUsersTable.createdAt),
				desc(blockedUsersTable.organizationId),
			];

	let where: SQL | undefined;

	if (cursorData !== undefined) {
		where = and(
			eq(blockedUsersTable.userId, parent.id),
			or(
				and(
					eq(blockedUsersTable.createdAt, new Date(cursorData.createdAt)),
					isInversed
						? gt(blockedUsersTable.organizationId, cursorData.organizationId)
						: lt(blockedUsersTable.organizationId, cursorData.organizationId),
				),
				isInversed
					? gt(blockedUsersTable.createdAt, new Date(cursorData.createdAt))
					: lt(blockedUsersTable.createdAt, new Date(cursorData.createdAt)),
			),
		);
	} else {
		where = eq(blockedUsersTable.userId, parent.id);
	}

	const blockedUsers = await ctx.drizzleClient.query.blockedUsersTable.findMany(
		{
			columns: {
				createdAt: true,
				organizationId: true,
			},
			limit,
			orderBy,
			with: {
				organization: true,
				user: true,
			},
			where,
		},
	);

	if (cursorData !== undefined && blockedUsers.length === 0) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: [parsedArgs.isInversed ? "before" : "after"],
					},
				],
			},
		});
	}

	return transformToDefaultGraphQLConnection({
		createCursor: (blockedUser) => ({
			createdAt: blockedUser.createdAt.toISOString(),
			organizationId: blockedUser.organizationId,
		}),
		createNode: (blockedUser) => ({
			id: blockedUser.organizationId,
			organization: blockedUser.organization,
			user: blockedUser.user,
			createdAt: blockedUser.createdAt,
		}),
		parsedArgs,
		rawNodes: blockedUsers,
	});
};

User.implement({
	fields: (t) => ({
		orgsWhereUserIsBlocked: t.connection(
			{
				description:
					"GraphQL connection to retrieve organizations where the user is blocked.",
				resolve: resolveOrgsWhereUserIsBlocked,
				type: BlockedUser,
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
			},
			{
				edgesField: {
					description: "Edge containing a BlockedUser record and cursor.",
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
			},
			{
				nodeField: {
					description:
						"BlockedUser record including the organization where the user is blocked.",
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
			},
		),
	}),
});
