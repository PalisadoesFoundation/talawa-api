import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { User } from "./User";

const organizationsWhereMemberArgumentsSchema =
	defaultGraphQLConnectionArgumentsSchema
		.extend({
			filter: z.string().optional(),
		})
		.transform(transformDefaultGraphQLConnectionArguments)
		.transform((arg, ctx) => {
			let cursor: z.infer<typeof cursorSchema> | undefined;
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
				filter: arg.filter,
			};
		});

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

User.implement({
	fields: (t) => ({
		organizationsWhereMember: t.connection({
			description:
				"GraphQL connection to traverse through the organizations the user is a member of.",
			args: {
				filter: t.arg.string({ required: false }),
			},
			resolve: async (parent, args, ctx) => {
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
				} = organizationsWhereMemberArgumentsSchema.safeParse(args);

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
					where: (fields, ops) => ops.eq(fields.id, currentUserId),
				});
				if (!currentUser) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}
				if (
					currentUser.role !== "administrator" &&
					currentUserId !== parent.id
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				const { cursor, isInversed, limit, filter } = parsedArgs;

				const orderBy = isInversed
					? [
							asc(organizationMembershipsTable.createdAt),
							asc(organizationMembershipsTable.organizationId),
						]
					: [
							desc(organizationMembershipsTable.createdAt),
							desc(organizationMembershipsTable.organizationId),
						];

				// A direct JOIN on organizationMemberships -> organizations.

				const baseQuery = ctx.drizzleClient
					.select({
						membershipCreatedAt: organizationMembershipsTable.createdAt,
						membershipOrganizationId:
							organizationMembershipsTable.organizationId,
						organization: organizationsTable, // We'll retrieve all org columns
					})
					.from(organizationMembershipsTable)
					.innerJoin(
						organizationsTable,
						eq(
							organizationMembershipsTable.organizationId,
							organizationsTable.id,
						),
					)
					.where(
						and(
							eq(organizationMembershipsTable.memberId, parent.id),

							filter
								? ilike(organizationsTable.name, `%${filter}%`)
								: sql`TRUE`,

							cursor
								? isInversed
									? // BACKWARD
										or(
											// same createdAt + orgId > cursor.orgId
											and(
												eq(
													organizationMembershipsTable.createdAt,
													cursor.createdAt,
												),
												gt(
													organizationMembershipsTable.organizationId,
													cursor.organizationId,
												),
											),
											// or createdAt > cursor.createdAt
											gt(
												organizationMembershipsTable.createdAt,
												cursor.createdAt,
											),
										)
									: // FORWARD
										or(
											// same createdAt + orgId < cursor.orgId
											and(
												eq(
													organizationMembershipsTable.createdAt,
													cursor.createdAt,
												),
												lt(
													organizationMembershipsTable.organizationId,
													cursor.organizationId,
												),
											),
											// or createdAt < cursor.createdAt
											lt(
												organizationMembershipsTable.createdAt,
												cursor.createdAt,
											),
										)
								: sql`TRUE`, // no cursor => no additional condition
						),
					)
					.limit(limit ?? 10)
					.orderBy(...orderBy);

				const records = await baseQuery;

				return transformToDefaultGraphQLConnection({
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
			},
			type: Organization,
		}),
	}),
});
