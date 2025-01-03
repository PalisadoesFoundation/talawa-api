import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import { z } from "zod";
import {
	fundCampaignPledgesTable,
	fundCampaignPledgesTableInsertSchema,
} from "~/src/drizzle/tables/fundCampaignPledges";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { FundCampaign } from "./FundCampaign";

const pledgesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = z.object({
	id: fundCampaignPledgesTableInsertSchema.shape.id.unwrap(),
});

FundCampaign.implement({
	fields: (t) => ({
		pledges: t.connection(
			{
				description:
					"GraphQL connection to traverse through the pledges made under the fund campaign.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = pledgesArgumentsSchema.safeParse(args);

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
						? [asc(fundCampaignPledgesTable.id)]
						: [desc(fundCampaignPledgesTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundCampaignPledgesTable)
										.where(
											and(
												eq(fundCampaignPledgesTable.campaignId, parent.id),
												eq(fundCampaignPledgesTable.id, cursor.id),
											),
										),
								),
								eq(fundCampaignPledgesTable.campaignId, parent.id),
								gt(fundCampaignPledgesTable.id, cursor.id),
							);
						} else {
							where = eq(fundCampaignPledgesTable.campaignId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundCampaignPledgesTable)
										.where(
											and(
												eq(fundCampaignPledgesTable.campaignId, parent.id),
												eq(fundCampaignPledgesTable.id, cursor.id),
											),
										),
								),
								eq(fundCampaignPledgesTable.campaignId, parent.id),
								lt(fundCampaignPledgesTable.id, cursor.id),
							);
						} else {
							where = eq(fundCampaignPledgesTable.campaignId, parent.id);
						}
					}

					const fundCampaignPledges =
						await ctx.drizzleClient.query.fundCampaignPledgesTable.findMany({
							limit,
							orderBy,
							where,
						});

					if (cursor !== undefined && fundCampaignPledges.length === 0) {
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
						createCursor: (pledge) =>
							Buffer.from(
								JSON.stringify({
									id: pledge.id,
								}),
							).toString("base64url"),
						createNode: (pledge) => pledge,
						parsedArgs,
						rawNodes: fundCampaignPledges,
					});
				},
				type: FundCampaignPledge,
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
