import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import type { z } from "zod";
import {
	agendaFoldersTable,
	agendaFoldersTableInsertSchema,
} from "~/src/drizzle/tables/agendaFolders";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { AgendaFolder } from "./AgendaFolder";

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

const cursorSchema = agendaFoldersTableInsertSchema
	.pick({
		name: true,
	})
	.extend({
		id: agendaFoldersTableInsertSchema.shape.id.unwrap(),
	});

AgendaFolder.implement({
	fields: (t) => ({
		childFolders: t.connection(
			{
				description:
					"GraphQL connection to traverse through the agenda folders that have the agenda folder as a parent folder.",
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
						? [desc(agendaFoldersTable.name), desc(agendaFoldersTable.id)]
						: [asc(agendaFoldersTable.name), asc(agendaFoldersTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(agendaFoldersTable)
										.where(
											and(
												eq(agendaFoldersTable.id, cursor.id),
												eq(agendaFoldersTable.name, cursor.name),
												eq(agendaFoldersTable.parentFolderId, parent.id),
											),
										),
								),
								eq(agendaFoldersTable.parentFolderId, parent.id),
								or(
									and(
										eq(agendaFoldersTable.name, cursor.name),
										lt(agendaFoldersTable.id, cursor.id),
									),
									lt(agendaFoldersTable.name, cursor.name),
								),
							);
						} else {
							where = eq(agendaFoldersTable.parentFolderId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(agendaFoldersTable)
										.where(
											and(
												eq(agendaFoldersTable.id, cursor.id),
												eq(agendaFoldersTable.name, cursor.name),
												eq(agendaFoldersTable.parentFolderId, parent.id),
											),
										),
								),
								eq(agendaFoldersTable.parentFolderId, parent.id),
								or(
									and(
										eq(agendaFoldersTable.name, cursor.name),
										gt(agendaFoldersTable.id, cursor.id),
									),
									gt(agendaFoldersTable.name, cursor.name),
								),
							);
						} else {
							where = eq(agendaFoldersTable.parentFolderId, parent.id);
						}
					}

					const agendaFolders =
						await ctx.drizzleClient.query.agendaFoldersTable.findMany({
							limit,
							orderBy,
							where,
						});

					if (cursor !== undefined && agendaFolders.length === 0) {
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
						createCursor: (agendaFolder) =>
							Buffer.from(
								JSON.stringify({
									id: agendaFolder.id,
									name: agendaFolder.name,
								}),
							).toString("base64url"),
						createNode: (agendaFolder) => agendaFolder,
						parsedArgs,
						rawNodes: agendaFolders,
					});
				},
				type: AgendaFolder,
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
