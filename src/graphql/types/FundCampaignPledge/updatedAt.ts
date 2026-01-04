import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import {
	FundCampaignPledge,
	type FundCampaignPledge as FundCampaignPledgeType,
} from "./FundCampaignPledge";

export const updatedAtResolver = async (
	parent: FundCampaignPledgeType,
	_args: Record<string, unknown>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Allow users to see updatedAt for their own pledges
	if (parent.pledgerId === currentUserId) {
		return parent.updatedAt;
	}

	const campaignId = parent.campaignId;
	const [currentUser, existingFundCampaign] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.fundCampaignsTable.findFirst({
			columns: {},
			with: {
				fund: {
					columns: {},
					with: {
						organization: {
							columns: {},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
				},
			},
			where: (fields, operators) => operators.eq(fields.id, campaignId),
		}),
	]);

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Fund campaign id existing but the associated fund campaign not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingFundCampaign === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a fund campaign pledge's campaign id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	const currentUserOrganizationMembership =
		existingFundCampaign.fund.organization.membershipsWhereOrganization[0];

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.updatedAt;
};

FundCampaignPledge.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description:
				"Date time at the time the fund campaign pledge was last updated.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: updatedAtResolver,
			type: "DateTime",
		}),
	}),
});
