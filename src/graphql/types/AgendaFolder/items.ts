import { and, asc, desc, eq, exists, gt, lt, or, type SQL } from "drizzle-orm";
import type { z } from "zod";
import {
	agendaItemsTable,
	agendaItemsTableInsertSchema,
} from "~/src/drizzle/tables/agendaItems";
import { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaFolder } from "./AgendaFolder";
export const itemsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = agendaItemsTableInsertSchema
	.pick({
		name: true,
	})
	.extend({
		id: agendaItemsTableInsertSchema.shape.id.unwrap(),
	});

AgendaFolder.implement({
	fields: (t) => ({
		items: t.connection(
			{
				description:
					"GraphQL connection to traverse through the agenda items contained within the agenda folder.",
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
					} = itemsArgumentsSchema.safeParse(args);

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
						? [desc(agendaItemsTable.name), desc(agendaItemsTable.id)]
						: [asc(agendaItemsTable.name), asc(agendaItemsTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(agendaItemsTable)
										.where(
											and(
												eq(agendaItemsTable.folderId, parent.id),
												eq(agendaItemsTable.id, cursor.id),
												eq(agendaItemsTable.name, cursor.name),
											),
										),
								),
								eq(agendaItemsTable.folderId, parent.id),
								or(
									and(
										eq(agendaItemsTable.name, cursor.name),
										lt(agendaItemsTable.id, cursor.id),
									),
									lt(agendaItemsTable.name, cursor.name),
								),
							);
						} else {
							where = eq(agendaItemsTable.folderId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(agendaItemsTable)
										.where(
											and(
												eq(agendaItemsTable.folderId, parent.id),
												eq(agendaItemsTable.id, cursor.id),
												eq(agendaItemsTable.name, cursor.name),
											),
										),
								),
								eq(agendaItemsTable.folderId, parent.id),
								or(
									and(
										eq(agendaItemsTable.name, cursor.name),
										gt(agendaItemsTable.id, cursor.id),
									),
									gt(agendaItemsTable.name, cursor.name),
								),
							);
						} else {
							where = eq(agendaItemsTable.folderId, parent.id);
						}
					}

					const agendaItems =
						await ctx.drizzleClient.query.agendaItemsTable.findMany({
							limit,
							orderBy,
							where,
						});

					if (cursor !== undefined && agendaItems.length === 0) {
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
						createCursor: (agendaItem) => ({
							id: agendaItem.id,
							name: agendaItem.name,
						}),
						createNode: (agendaItem) => agendaItem,
						parsedArgs,
						rawNodes: agendaItems,
					});
				},
				type: AgendaItem,
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
