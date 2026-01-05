import {
	and,
	asc,
	desc,
	eq,
	exists,
	gt,
	ilike,
	inArray,
	lt,
	ne,
	or,
	type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import {
	createGraphQLConnectionWithWhereSchema,
	type defaultGraphQLConnectionArgumentsSchema,
	type ParsedDefaultGraphQLConnectionArgumentsWithWhere,
	transformGraphQLConnectionArgumentsWithWhere,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { MembersWhereInput } from "../../inputs/QueryOrganizationInput";
import { Organization } from "./Organization";

type UserRole = z.infer<typeof organizationMembershipRoleEnum>;
type MembersWhere = {
	name_contains?: string;
	role?: { equal?: UserRole; notEqual?: UserRole };
};
const membersRoleWhereInputSchema = z.object({
	equal: organizationMembershipRoleEnum.optional(),
	notEqual: organizationMembershipRoleEnum.optional(),
});

const organizationMembersWhereSchema = z
	.object({
		role: membersRoleWhereInputSchema.optional(),
		name_contains: z.string().max(100).optional(),
	})
	.optional();

// Create a connection arguments schema with the where clause
const membersArgumentsSchema = createGraphQLConnectionWithWhereSchema(
	organizationMembersWhereSchema,
).transform((arg, ctx) => {
	// First transform using the connection with where transformer
	const transformedArg = transformGraphQLConnectionArgumentsWithWhere(
		// Type assertion to match the expected type
		{ ...arg, where: arg.where || {} } as z.infer<
			typeof defaultGraphQLConnectionArgumentsSchema
		> & { where: unknown },
		ctx,
	);

	let cursor: z.infer<typeof cursorSchema> | undefined;
	try {
		if (transformedArg.cursor !== undefined) {
			cursor = cursorSchema.parse(
				JSON.parse(
					Buffer.from(transformedArg.cursor, "base64url").toString("utf-8"),
				),
			);
		}
	} catch (_error) {
		ctx.addIssue({
			code: "custom",
			message: "Not a valid cursor.",
			path: [transformedArg.isInversed ? "before" : "after"],
		});
	}

	const rawWhere = (transformedArg.where || {}) as MembersWhere;
	const trimmedNameContains =
		typeof rawWhere.name_contains === "string"
			? rawWhere.name_contains.trim()
			: undefined;

	const sanitizedWhere: MembersWhere = trimmedNameContains
		? { ...rawWhere, name_contains: trimmedNameContains }
		: (({ name_contains: _omitted, ...rest }) => rest)(rawWhere);

	return {
		cursor,
		isInversed: transformedArg.isInversed,
		limit: transformedArg.limit,
		where: sanitizedWhere, // Default to empty object if where is undefined
	};
});

const cursorSchema = organizationMembershipsTableInsertSchema
	.pick({
		memberId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		memberId: arg.memberId,
	}));

Organization.implement({
	fields: (t) => ({
		members: t.connection(
			{
				description:
					"GraphQL connection to traverse through the users that are members of the organization.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				args: {
					where: t.arg({
						type: MembersWhereInput,
						description: "Filter criteria for organization members",
						required: false,
					}),
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
					} = membersArgumentsSchema.safeParse(args);

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
							columns: {
								role: true,
							},
							with: {
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.id),
								},
							},
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

					const currentUserOrganizationMembership =
						currentUser.organizationMembershipsWhereMember[0];

					if (
						currentUser.role !== "administrator" &&
						currentUserOrganizationMembership === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit, where } =
						parsedArgs as ParsedDefaultGraphQLConnectionArgumentsWithWhere<
							{ createdAt: Date; memberId: string },
							MembersWhere
						>;

					const orderBy = isInversed
						? [
								asc(organizationMembershipsTable.createdAt),
								asc(organizationMembershipsTable.memberId),
							]
						: [
								desc(organizationMembershipsTable.createdAt),
								desc(organizationMembershipsTable.memberId),
							];

					let queryWhere: SQL | undefined;

					const roleFilter = where?.role
						? and(
								where.role.equal
									? eq(
											organizationMembershipsTable.role,
											where.role.equal as UserRole,
										)
									: undefined,
								where.role.notEqual
									? ne(
											organizationMembershipsTable.role,
											where.role.notEqual as UserRole,
										)
									: undefined,
							)
						: undefined;

					const nameFilter = where?.name_contains
						? inArray(
								organizationMembershipsTable.memberId,
								ctx.drizzleClient
									.select({ id: usersTable.id })
									.from(usersTable)
									.where(ilike(usersTable.name, `%${where.name_contains}%`)),
							)
						: undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							queryWhere = and(
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
												eq(
													organizationMembershipsTable.memberId,
													cursor.memberId,
												),
												eq(
													organizationMembershipsTable.organizationId,
													parent.id,
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
										gt(organizationMembershipsTable.memberId, cursor.memberId),
									),
									gt(organizationMembershipsTable.createdAt, cursor.createdAt),
								),
								roleFilter,
								nameFilter,
							);
						} else {
							queryWhere = and(
								eq(organizationMembershipsTable.organizationId, parent.id),
								roleFilter,
								nameFilter,
							);
						}
					} else {
						if (cursor !== undefined) {
							queryWhere = and(
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
												eq(
													organizationMembershipsTable.memberId,
													cursor.memberId,
												),
												eq(
													organizationMembershipsTable.organizationId,
													parent.id,
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
										lt(organizationMembershipsTable.memberId, cursor.memberId),
									),
									lt(organizationMembershipsTable.createdAt, cursor.createdAt),
								),
								roleFilter,
								nameFilter,
							);
						} else {
							queryWhere = and(
								eq(organizationMembershipsTable.organizationId, parent.id),
								roleFilter,
								nameFilter,
							);
						}
					}

					const organizationMemberships =
						await ctx.drizzleClient.query.organizationMembershipsTable.findMany(
							{
								columns: {
									createdAt: true,
									memberId: true,
								},
								limit,
								orderBy,
								with: {
									member: true,
								},
								where: queryWhere,
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
						createCursor: (organizationMembership) => ({
							createdAt: organizationMembership.createdAt,
							memberId: organizationMembership.memberId,
						}),
						createNode: (organizationMembership) =>
							organizationMembership.member,
						parsedArgs,
						rawNodes: organizationMemberships,
					});
				},
				type: User,
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
