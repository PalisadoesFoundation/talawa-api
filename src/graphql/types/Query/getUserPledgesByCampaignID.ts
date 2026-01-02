import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * Resolver function to get pledges for the current user in a specific campaign.
 * @param _parent - Parent object (unused)
 * @param args - Arguments containing campaignId
 * @param ctx - GraphQL context
 * @returns - Array of fund campaign pledges
 */
export const resolveGetMyPledgesForCampaign = async (
	_parent: Record<string, unknown>,
	args: { campaignId: string },
	ctx: GraphQLContext,
) => {
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
				code: ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
			},
		});
	}

	return pledges;
};

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
		resolve: resolveGetMyPledgesForCampaign,
		type: [FundCampaignPledge],
	}),
);
