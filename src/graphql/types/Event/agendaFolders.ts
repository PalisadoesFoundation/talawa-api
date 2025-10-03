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
	agendaFoldersTable,
	agendaFoldersTableInsertSchema,
} from "~/src/drizzle/tables/agendaFolders";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Event } from "./Event";

const agendaFoldersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = agendaFoldersTableInsertSchema
	.pick({
		name: true,
	})
	.extend({
		id: agendaFoldersTableInsertSchema.shape.id.unwrap(),
	});

Event.implement({
	fields: (t) => ({
		agendaFolders: t.connection(
			{
				description:
					"GraphQL connection to traverse through the agenda folders that contain agenda items constituting a part of the agenda for the event.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = agendaFoldersArgumentsSchema.safeParse(args);

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
												eq(agendaFoldersTable.eventId, parent.id),
												eq(agendaFoldersTable.id, cursor.id),
												eq(agendaFoldersTable.name, cursor.name),
												isNull(agendaFoldersTable.parentFolderId),
											),
										),
								),
								eq(agendaFoldersTable.eventId, parent.id),
								isNull(agendaFoldersTable.parentFolderId),
								or(
									and(
										eq(agendaFoldersTable.name, cursor.name),
										lt(agendaFoldersTable.id, cursor.id),
									),
									lt(agendaFoldersTable.name, cursor.name),
								),
							);
						} else {
							where = and(
								eq(agendaFoldersTable.eventId, parent.id),
								isNull(agendaFoldersTable.parentFolderId),
							);
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
												eq(agendaFoldersTable.eventId, parent.id),
												eq(agendaFoldersTable.id, cursor.id),
												eq(agendaFoldersTable.name, cursor.name),
												isNull(agendaFoldersTable.parentFolderId),
											),
										),
								),
								eq(agendaFoldersTable.eventId, parent.id),
								isNull(agendaFoldersTable.parentFolderId),
								or(
									and(
										eq(agendaFoldersTable.name, cursor.name),
										gt(agendaFoldersTable.id, cursor.id),
									),
									gt(agendaFoldersTable.name, cursor.name),
								),
							);
						} else {
							where = and(
								eq(agendaFoldersTable.eventId, parent.id),
								isNull(agendaFoldersTable.parentFolderId),
							);
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
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
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
