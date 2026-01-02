import { and, asc, desc, eq, exists, gt, lt, type SQL } from "drizzle-orm";
import type { z } from "zod";
import {
	fundCampaignsTable,
	fundCampaignsTableInsertSchema,
} from "~/src/drizzle/tables/fundCampaigns";
import { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Fund } from "./Fund";

const campaignsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = fundCampaignsTableInsertSchema.pick({
	name: true,
});

Fund.implement({
	fields: (t) => ({
		campaigns: t.connection(
			{
				description:
					"GraphQL connection to traverse through the campaigns for the fund.",

				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = campaignsArgumentsSchema.safeParse(args);

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
						? [desc(fundCampaignsTable.name)]
						: [asc(fundCampaignsTable.name)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundCampaignsTable)
										.where(
											and(
												eq(fundCampaignsTable.fundId, parent.id),
												eq(fundCampaignsTable.name, cursor.name),
											),
										),
								),
								eq(fundCampaignsTable.fundId, parent.id),
								lt(fundCampaignsTable.name, cursor.name),
							);
						} else {
							where = eq(fundCampaignsTable.fundId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundCampaignsTable)
										.where(
											and(
												eq(fundCampaignsTable.fundId, parent.id),
												eq(fundCampaignsTable.name, cursor.name),
											),
										),
								),
								eq(fundCampaignsTable.fundId, parent.id),
								gt(fundCampaignsTable.name, cursor.name),
							);
						} else {
							where = eq(fundCampaignsTable.fundId, parent.id);
						}
					}

					const fundCampaigns =
						await ctx.drizzleClient.query.fundCampaignsTable.findMany({
							limit,
							orderBy,
							where,
						});

					if (cursor !== undefined && fundCampaigns.length === 0) {
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
						createCursor: (campaign) =>
							Buffer.from(
								JSON.stringify({
									name: campaign.name,
								}),
							).toString("base64url"),
						createNode: (campaign) => campaign,
						parsedArgs,
						rawNodes: fundCampaigns,
					});
				},
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				type: FundCampaign,
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
