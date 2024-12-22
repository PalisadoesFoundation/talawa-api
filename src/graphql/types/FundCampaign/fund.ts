import { Fund } from "~/src/graphql/types/Fund/Fund";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { FundCampaign } from "./FundCampaign";

FundCampaign.implement({
	fields: (t) => ({
		fund: t.field({
			description: "Fund which the campaign is associated to.",
			resolve: async (parent, _args, ctx) => {
				const existingFund = await ctx.drizzleClient.query.fundsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.eq(fields.id, parent.fundId),
					},
				);

				// Fund id existing but the associated fund not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingFund === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a tag's fund id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return existingFund;
			},
			type: Fund,
		}),
	}),
});
