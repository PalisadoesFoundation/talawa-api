import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import type { z } from "zod";
import { tagsTable, tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { Organization } from "./Organization";

const tagsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = tagsTableInsertSchema.pick({
	isFolder: true,
	name: true,
});

Organization.implement({
	fields: (t) => ({
		tags: t.connection(
			{
				description:
					"GraphQL connection to traverse through the tags associated to the organization.",
				resolve: async (parent, args, ctx) => {
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
							message: "Only authenticated users can perform this action.",
						});
					}

					const {
						data: parsedArgs,
						error,
						success,
					} = tagsArgumentsSchema.safeParse(args);

					if (!success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: error.issues.map((issue) => ({
									argumentPath: issue.path,
									message: issue.message,
								})),
							},
							message: "Invalid arguments provided.",
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
									columns: {},
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
							message: "Only authenticated users can perform this action.",
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
							message: "You are not authorized to perform this action.",
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [asc(tagsTable.isFolder), asc(tagsTable.name)]
						: [desc(tagsTable.isFolder), desc(tagsTable.name)];

					let where: SQL | undefined;
					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(tagsTable)
										.where(
											and(
												eq(tagsTable.isFolder, cursor.isFolder),
												eq(tagsTable.name, cursor.name),
												eq(tagsTable.organizationId, parent.id),
											),
										),
								),
								eq(tagsTable.organizationId, parent.id),
								or(
									and(
										eq(tagsTable.isFolder, cursor.isFolder),
										gt(tagsTable.name, cursor.name),
									),
									gt(tagsTable.isFolder, cursor.isFolder),
								),
							);
						} else {
							where = eq(tagsTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(tagsTable)
										.where(
											and(
												eq(tagsTable.isFolder, cursor.isFolder),
												eq(tagsTable.name, cursor.name),
												eq(tagsTable.organizationId, parent.id),
											),
										),
								),
								eq(tagsTable.organizationId, parent.id),
								or(
									and(
										eq(tagsTable.isFolder, cursor.isFolder),
										lt(tagsTable.name, cursor.name),
									),
									lt(tagsTable.isFolder, cursor.isFolder),
								),
							);
						} else {
							where = eq(tagsTable.organizationId, parent.id);
						}
					}

					const tags = await ctx.drizzleClient.query.tagsTable.findMany({
						limit,
						orderBy,
						where,
					});

					if (cursor !== undefined && tags.length === 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: [isInversed ? "before" : "after"],
									},
								],
							},
							message:
								"No associated resources found for the provided arguments.",
						});
					}

					return transformToDefaultGraphQLConnection({
						createCursor: (tag) =>
							Buffer.from(
								JSON.stringify({
									isFolder: tag.isFolder,
									name: tag.name,
								}),
							).toString("base64url"),
						createNode: (tag) => tag,
						parsedArgs,
						rawNodes: tags,
					});
				},
				type: Tag,
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
