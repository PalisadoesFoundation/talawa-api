import { type SQL, and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

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
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}
		return {
			cursor: cursorObj
				? Buffer.from(
						JSON.stringify({
							createdAt: cursorObj.createdAt,
							organizationId: cursorObj.organizationId,
						}),
					).toString("base64url")
				: undefined,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

export const resolveOrgsWhereUserIsBlocked = async (
	parent: User,
	args: Record<string, unknown>,
	ctx: ContextType,
): Promise<
	ReturnType<typeof transformToDefaultGraphQLConnection<unknown, Organization>>
> => {
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
		? [asc(blockedUsersTable.createdAt), asc(blockedUsersTable.organizationId)]
		: [
				desc(blockedUsersTable.createdAt),
				desc(blockedUsersTable.organizationId),
			];

	let where: SQL | undefined;

	if (cursor !== undefined) {
		const cursorData = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf-8"),
		);
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
			},
			where,
		},
	);

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
};

User.implement({
	fields: (t) => ({
		orgsWhereUserIsBlocked: t.connection(
			{
				description:
					"GraphQL connection to retrieve organizations where the user is blocked.",
				resolve: resolveOrgsWhereUserIsBlocked,
				type: Organization,
			},
			{
				edgesField: {
					description: "",
				},
			},
			{
				nodeField: {
					description: "",
				},
			},
		),
	}),
});
