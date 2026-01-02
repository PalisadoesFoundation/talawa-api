import { and, asc, desc, eq, exists, gt, lt, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
	advertisementsTable,
	advertisementsTableInsertSchema,
} from "~/src/drizzle/tables/advertisements";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import envConfig from "~/src/utilities/graphqLimits";
import {
	createGraphQLConnectionWithWhereSchema,
	type defaultGraphQLConnectionArgumentsSchema,
	type ParsedDefaultGraphQLConnectionArgumentsWithWhere,
	transformGraphQLConnectionArgumentsWithWhere,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AdvertisementWhereInput } from "../../inputs/QueryOrganizationInput";
import { Organization } from "./Organization";

const advertisementWhereSchema = z
	.object({
		isCompleted: z.boolean().optional(),
	})
	.optional();

const advertisementsArgumentsSchema = createGraphQLConnectionWithWhereSchema(
	advertisementWhereSchema,
).transform((arg, ctx) => {
	const transformedArg = transformGraphQLConnectionArgumentsWithWhere(
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
	return {
		cursor,
		isInversed: transformedArg.isInversed,
		limit: transformedArg.limit,
		where: transformedArg.where || {}, // Default to empty object if where is undefined
	};
});

const cursorSchema = advertisementsTableInsertSchema.pick({
	name: true,
});

Organization.implement({
	fields: (t) => ({
		advertisements: t.connection(
			{
				description:
					"GraphQL connection to traverse through the advertisements belonging to the organization.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				args: {
					where: t.arg({
						type: AdvertisementWhereInput,
						description: "Filter criteria for advertisements",
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
					} = advertisementsArgumentsSchema.safeParse(args);
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

					const {
						cursor,
						isInversed,
						limit,
						where: extendedArgs,
					} = parsedArgs as ParsedDefaultGraphQLConnectionArgumentsWithWhere<
						{ name: string },
						{ isCompleted?: boolean }
					>;

					const orderBy = isInversed
						? [desc(advertisementsTable.name)]
						: [asc(advertisementsTable.name)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							const baseCondition = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(advertisementsTable)
										.where(
											and(
												eq(advertisementsTable.name, cursor.name),
												eq(advertisementsTable.organizationId, parent.id),
											),
										),
								),
								eq(advertisementsTable.organizationId, parent.id),
								lt(advertisementsTable.name, cursor.name),
							);

							if (extendedArgs.isCompleted !== undefined) {
								const today = new Date();

								if (extendedArgs.isCompleted) {
									where = and(
										baseCondition,
										lt(advertisementsTable.endAt, today),
									);
								} else {
									where = and(
										baseCondition,
										gt(advertisementsTable.endAt, today),
									);
								}
							} else {
								where = baseCondition;
							}
						} else {
							const baseCondition = eq(
								advertisementsTable.organizationId,
								parent.id,
							);

							if (extendedArgs.isCompleted !== undefined) {
								const today = new Date();

								if (extendedArgs.isCompleted) {
									where = and(
										baseCondition,
										lt(advertisementsTable.endAt, today),
									);
								} else {
									where = and(
										baseCondition,
										gt(advertisementsTable.endAt, today),
									);
								}
							} else {
								where = baseCondition;
							}
						}
					} else {
						if (cursor !== undefined) {
							const baseCondition = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(advertisementsTable)
										.where(
											and(
												eq(advertisementsTable.name, cursor.name),
												eq(advertisementsTable.organizationId, parent.id),
											),
										),
								),
								eq(advertisementsTable.organizationId, parent.id),
								gt(advertisementsTable.name, cursor.name),
							);

							if (extendedArgs.isCompleted !== undefined) {
								const today = new Date();

								if (extendedArgs.isCompleted) {
									where = and(
										baseCondition,
										lt(advertisementsTable.endAt, today),
									);
								} else {
									where = and(
										baseCondition,
										gt(advertisementsTable.endAt, today),
									);
								}
							} else {
								where = baseCondition;
							}
						} else {
							const baseCondition = eq(
								advertisementsTable.organizationId,
								parent.id,
							);

							if (extendedArgs.isCompleted !== undefined) {
								const today = new Date();

								if (extendedArgs.isCompleted) {
									where = and(
										baseCondition,
										lt(advertisementsTable.endAt, today),
									);
								} else {
									where = and(
										baseCondition,
										gt(advertisementsTable.endAt, today),
									);
								}
							} else {
								where = baseCondition;
							}
						}
					}

					const advertisements =
						await ctx.drizzleClient.query.advertisementsTable.findMany({
							limit,
							orderBy,
							with: {
								attachmentsWhereAdvertisement: true,
							},
							where,
						});

					if (cursor !== undefined && advertisements.length === 0) {
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
						createCursor: (advertisement) => ({
							name: advertisement.name,
						}),
						createNode: ({ attachmentsWhereAdvertisement, ...advertisement }) =>
							Object.assign(advertisement, {
								attachments: attachmentsWhereAdvertisement,
							}),
						parsedArgs,
						rawNodes: advertisements,
					});
				},
				type: Advertisement,
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
