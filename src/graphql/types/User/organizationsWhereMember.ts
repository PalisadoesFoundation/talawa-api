import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/organizationMemberships";
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
		organizationsWhereMember: t.connection(
			{
				description:
					"GraphQL connection to traverse through the organizations the user is a member of.",
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

					const currentUser =
						await ctx.drizzleClient.query.usersTable.findFirst({
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						});

					if (currentUser === undefined) {
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

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [
								asc(organizationMembershipsTable.createdAt),
								asc(organizationMembershipsTable.organizationId),
							]
						: [
								desc(organizationMembershipsTable.createdAt),
								desc(organizationMembershipsTable.organizationId),
							];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(organizationMembershipsTable)
										.where(
											and(
												eq(
													organizationMembershipsTable.createdAt,
													cursor.createdAt,
												),
												eq(organizationMembershipsTable.memberId, parent.id),
												eq(
													organizationMembershipsTable.organizationId,
													cursor.organizationId,
												),
											),
										),
								),
								eq(organizationMembershipsTable.memberId, parent.id),
								or(
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
									gt(organizationMembershipsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(organizationMembershipsTable.memberId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(organizationMembershipsTable)
										.where(
											and(
												eq(
													organizationMembershipsTable.createdAt,
													cursor.createdAt,
												),
												eq(organizationMembershipsTable.memberId, parent.id),
												eq(
													organizationMembershipsTable.memberId,
													cursor.organizationId,
												),
											),
										),
								),
								eq(organizationMembershipsTable.organizationId, parent.id),
								or(
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
									lt(organizationMembershipsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(organizationMembershipsTable.memberId, parent.id);
						}
					}

					const organizationMemberships =
						await ctx.drizzleClient.query.organizationMembershipsTable.findMany(
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

					if (cursor !== undefined && organizationMemberships.length === 0) {
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
						createCursor: (membership) =>
							Buffer.from(
								JSON.stringify({
									createdAt: membership.createdAt.toISOString(),
									organizationId: membership.organizationId,
								}),
							).toString("base64url"),
						createNode: (membership) => membership.organization,
						parsedArgs,
						rawNodes: organizationMemberships,
					});
				},
				type: Organization,
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
