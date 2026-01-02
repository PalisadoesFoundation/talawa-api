import { and, asc, desc, eq, exists, gt, lt, type SQL } from "drizzle-orm";
import type { z } from "zod";
import { tagsTable, tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { TagFolder } from "./TagFolder";

const tagsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = tagsTableInsertSchema.pick({
	name: true,
});

TagFolder.implement({
	fields: (t) => ({
		tags: t.connection(
			{
				description:
					"GraphQL connection to traverse through the tags contained within the tag folder.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				resolve: async (parent, args, ctx) => {
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
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(tagsTable.name)]
						: [asc(tagsTable.name)];

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
												eq(tagsTable.name, cursor.name),
												eq(tagsTable.organizationId, parent.id),
											),
										),
								),
								eq(tagsTable.organizationId, parent.id),
								lt(tagsTable.name, cursor.name),
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
												eq(tagsTable.name, cursor.name),
												eq(tagsTable.organizationId, parent.id),
											),
										),
								),
								eq(tagsTable.organizationId, parent.id),
								gt(tagsTable.name, cursor.name),
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
						});
					}

					return transformToDefaultGraphQLConnection({
						createCursor: (tag) => ({
							name: tag.name,
						}),
						createNode: (tag) => tag,
						parsedArgs,
						rawNodes: tags,
					});
				},
				type: Tag,
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
