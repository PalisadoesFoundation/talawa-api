import { builder } from "~/src/graphql/builder";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.queryField("getMyPledgesForCampaign", (t) =>
	t.field({
		args: {
			campaignId: t.arg({
				description: "Global id of the campaign.",
				required: true,
				type: "ID",
			}),
		},
		description: "Get pledges for the current user in a specific campaign.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const currentUserId = ctx.currentClient.user.id;
			const campaignId = args.campaignId;

			const pledges =
				await ctx.drizzleClient.query.fundCampaignPledgesTable.findMany({
					where: (pledges, operators) =>
						operators.and(
							operators.eq(pledges.campaignId, campaignId),
							operators.or(
								operators.eq(pledges.pledgerId, currentUserId),
								operators.eq(pledges.creatorId, currentUserId),
							),
						),
					with: {
						pledger: {
							columns: { id: true, name: true, avatarName: true },
						},
						campaign: {
							columns: {
								id: true,
								name: true,
								startAt: true,
								endAt: true,
								currencyCode: true,
							},
						},
					},
				});

			if (!pledges.length) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["campaignId"] }],
					},
				});
			}

			return pledges;
		},
		type: [FundCampaignPledge],
	}),
);
