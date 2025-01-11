import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import type { z } from "zod";
import {
	advertisementsTable,
	advertisementsTableInsertSchema,
} from "~/src/drizzle/tables/advertisements";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

const advertisementsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = advertisementsTableInsertSchema.pick({
	name: true,
});

Organization.implement({
	fields: (t) => ({
		advertisements: t.connection(
			{
				description:
					"GraphQL connection to traverse through the advertisements belonging to the organization.",
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

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(advertisementsTable.name)]
						: [asc(advertisementsTable.name)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
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
						} else {
							where = eq(advertisementsTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
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
						} else {
							where = eq(advertisementsTable.organizationId, parent.id);
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
						createCursor: (advertisement) =>
							Buffer.from(
								JSON.stringify({
									name: advertisement.name,
								}),
							).toString("base64url"),
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
				description: "",
			},
			{
				description: "",
			},
		),
	}),
});
