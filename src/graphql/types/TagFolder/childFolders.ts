import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import type { z } from "zod";
import {
	tagFoldersTable,
	tagFoldersTableInsertSchema,
} from "~/src/drizzle/tables/tagFolders";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { TagFolder } from "./TagFolder";

const childFoldersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = tagFoldersTableInsertSchema.pick({
	name: true,
});

TagFolder.implement({
	fields: (t) => ({
		childFolders: t.connection(
			{
				description:
					"GraphQL connection to traverse through the tag folders contained within the tag folder.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = childFoldersArgumentsSchema.safeParse(args);

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
						? [desc(tagFoldersTable.name)]
						: [asc(tagFoldersTable.name)];

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
												eq(tagFoldersTable.name, cursor.name),
												eq(tagFoldersTable.parentFolderId, parent.id),
											),
										),
								),
								eq(tagFoldersTable.parentFolderId, parent.id),
								lt(tagFoldersTable.name, cursor.name),
							);
						} else {
							where = eq(tagFoldersTable.parentFolderId, parent.id);
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
												eq(tagFoldersTable.name, cursor.name),
												eq(tagFoldersTable.parentFolderId, parent.id),
											),
										),
								),
								eq(tagFoldersTable.parentFolderId, parent.id),
								gt(tagFoldersTable.name, cursor.name),
							);
						} else {
							where = eq(tagFoldersTable.parentFolderId, parent.id);
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
						createCursor: (tag) =>
							Buffer.from(
								JSON.stringify({
									name: tag.name,
								}),
							).toString("base64url"),
						createNode: (tag) => tag,
						parsedArgs,
						rawNodes: tagFolders,
					});
				},
				type: TagFolder,
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
