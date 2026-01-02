import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "./User";

interface OrganizationMembershipRawNode {
	membershipCreatedAt: Date;
	membershipOrganizationId: string;
	organization: Organization;
}

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

const cursorSchema = organizationMembershipsTableInsertSchema
	.pick({
		organizationId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		organizationId: arg.organizationId,
	}));

export type OrganizationsWhereMemberArgs = z.input<
	typeof defaultGraphQLConnectionArgumentsSchema
> & {
	filter?: string | null;
};

const organizationsWhereMemberArgumentsSchema =
	defaultGraphQLConnectionArgumentsSchema
		.extend({
			filter: z.string().optional(),
		})
		.transform(transformDefaultGraphQLConnectionArguments)
		.transform((arg, ctx) => {
			let cursorObj: z.infer<typeof cursorSchema> | undefined;
			try {
				if (arg.cursor !== undefined) {
					cursorObj = cursorSchema.parse(
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
				cursor: cursorObj
					? Buffer.from(
							JSON.stringify({
								createdAt: cursorObj.createdAt.toISOString(),
								organizationId: cursorObj.organizationId,
							}),
						).toString("base64url")
					: undefined,
				isInversed: arg.isInversed,
				limit: arg.limit,
				filter: arg.filter,
			};
		});

export const resolveOrganizationsWhereMember = async (
	parent: User,
	args: { filter?: string | null },
	ctx: ContextType,
): Promise<
	ReturnType<
		typeof transformToDefaultGraphQLConnection<
			OrganizationMembershipRawNode,
			Organization
		>
	>
> => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const parseResult = organizationsWhereMemberArgumentsSchema.safeParse(args);
	if (!parseResult.success) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: parseResult.error.issues.map((issue) => ({
					argumentPath: issue.path,
					message: issue.message,
				})),
			},
		});
	}
	const parsedArgs = parseResult.data;
	const { cursor, isInversed, limit, filter } = parsedArgs;

	const currentUserId = ctx.currentClient.user.id;
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, ops) => ops.eq(fields.id, currentUserId),
	});
	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	if (currentUser.role !== "administrator" && currentUserId !== parent.id) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	const orderBy = isInversed
		? [
				asc(organizationMembershipsTable.createdAt),
				asc(organizationMembershipsTable.organizationId),
			]
		: [
				desc(organizationMembershipsTable.createdAt),
				desc(organizationMembershipsTable.organizationId),
			];

	const baseQuery = ctx.drizzleClient
		.select({
			membershipCreatedAt: organizationMembershipsTable.createdAt,
			membershipOrganizationId: organizationMembershipsTable.organizationId,
			organization: organizationsTable,
		})
		.from(organizationMembershipsTable)
		.innerJoin(
			organizationsTable,
			eq(organizationMembershipsTable.organizationId, organizationsTable.id),
		)
		.where(
			and(
				eq(organizationMembershipsTable.memberId, parent.id),
				filter ? ilike(organizationsTable.name, `%${filter}%`) : sql`TRUE`,
				cursor
					? isInversed
						? or(
								and(
									eq(
										organizationMembershipsTable.createdAt,

										new Date(
											JSON.parse(
												Buffer.from(cursor, "base64url").toString("utf-8"),
											).createdAt,
										),
									),
									gt(
										organizationMembershipsTable.organizationId,
										JSON.parse(
											Buffer.from(cursor, "base64url").toString("utf-8"),
										).organizationId,
									),
								),

								gt(
									organizationMembershipsTable.createdAt,
									new Date(
										JSON.parse(
											Buffer.from(cursor, "base64url").toString("utf-8"),
										).createdAt,
									),
								),
							)
						: or(
								and(
									eq(
										organizationMembershipsTable.createdAt,
										new Date(
											JSON.parse(
												Buffer.from(cursor, "base64url").toString("utf-8"),
											).createdAt,
										),
									),
									lt(
										organizationMembershipsTable.organizationId,
										JSON.parse(
											Buffer.from(cursor, "base64url").toString("utf-8"),
										).organizationId,
									),
								),

								lt(
									organizationMembershipsTable.createdAt,
									new Date(
										JSON.parse(
											Buffer.from(cursor, "base64url").toString("utf-8"),
										).createdAt,
									),
								),
							)
					: sql`TRUE`,
			),
		)
		.limit(limit ?? 10)
		.orderBy(...orderBy);

	const records: OrganizationMembershipRawNode[] = await baseQuery.execute();

	// Transform the raw nodes into a connection.
	return transformToDefaultGraphQLConnection<
		OrganizationMembershipRawNode,
		Organization
	>({
		createCursor: (row) =>
			Buffer.from(
				JSON.stringify({
					createdAt: row.membershipCreatedAt.toISOString(),
					organizationId: row.membershipOrganizationId,
				}),
			).toString("base64url"),

		createNode: (row) => row.organization,
		parsedArgs,
		rawNodes: records,
	});
};

User.implement({
	fields: (t) => ({
		organizationsWhereMember: t.connection(
			{
				description:
					"GraphQL connection to traverse through the organizations the user is a member of.",
				args: {
					filter: t.arg.string({ required: false }),
				},
				resolve: resolveOrganizationsWhereMember,
				type: Organization,
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
