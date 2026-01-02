import {
	and,
	asc,
	desc,
	eq,
	exists,
	gt,
	isNull,
	lt,
	or,
	type SQL,
} from "drizzle-orm";
import type { z } from "zod";
import {
	tagFoldersTable,
	tagFoldersTableInsertSchema,
} from "~/src/drizzle/tables/tagFolders";
import { TagFolder } from "~/src/graphql/types/TagFolder/TagFolder";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

const tagFoldersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = tagFoldersTableInsertSchema
	.pick({
		name: true,
	})
	.extend({
		id: tagFoldersTableInsertSchema.shape.id.unwrap(),
	});

Organization.implement({
	fields: (t) => ({
		tagFolders: t.connection(
			{
				description:
					"GraphQL connection to traverse through the tag folders belonging to the organization.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
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
					} = tagFoldersArgumentsSchema.safeParse(args);

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
						(currentUserOrganizationMembership === undefined ||
							currentUserOrganizationMembership.role !== "administrator")
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(tagFoldersTable.name), desc(tagFoldersTable.id)]
						: [asc(tagFoldersTable.name), asc(tagFoldersTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(tagFoldersTable)
										.where(
											and(
												eq(tagFoldersTable.id, cursor.id),
												isNull(tagFoldersTable.parentFolderId),
												eq(tagFoldersTable.name, cursor.name),
												eq(tagFoldersTable.organizationId, parent.id),
											),
										),
								),
								isNull(tagFoldersTable.parentFolderId),
								eq(tagFoldersTable.organizationId, parent.id),
								or(
									and(
										eq(tagFoldersTable.name, cursor.name),
										lt(tagFoldersTable.id, cursor.id),
									),
									lt(tagFoldersTable.name, cursor.name),
								),
							);
						} else {
							where = and(
								isNull(tagFoldersTable.parentFolderId),
								eq(tagFoldersTable.organizationId, parent.id),
							);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(tagFoldersTable)
										.where(
											and(
												eq(tagFoldersTable.id, cursor.id),
												isNull(tagFoldersTable.parentFolderId),
												eq(tagFoldersTable.name, cursor.name),
												eq(tagFoldersTable.organizationId, parent.id),
											),
										),
								),
								isNull(tagFoldersTable.parentFolderId),
								eq(tagFoldersTable.organizationId, parent.id),
								or(
									and(
										eq(tagFoldersTable.name, cursor.name),
										gt(tagFoldersTable.id, cursor.id),
									),
									gt(tagFoldersTable.name, cursor.name),
								),
							);
						} else {
							where = and(
								isNull(tagFoldersTable.parentFolderId),
								eq(tagFoldersTable.organizationId, parent.id),
							);
						}
					}

					const tagFolders =
						await ctx.drizzleClient.query.tagFoldersTable.findMany({
							limit,
							orderBy,
							where,
						});

					if (cursor !== undefined && tagFolders.length === 0) {
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
						createCursor: (tag) => ({
							id: tag.id,
							name: tag.name,
						}),
						createNode: (tag) => tag,
						parsedArgs,
						rawNodes: tagFolders,
					});
				},
				type: TagFolder,
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
