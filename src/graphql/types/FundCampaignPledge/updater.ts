import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	FundCampaignPledge,
	type FundCampaignPledge as FundCampaignPledgeType,
} from "./FundCampaignPledge";
export const resolveUpdater = async (
	parent: FundCampaignPledgeType,
	_args: Record<string, never>,
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

	// Allow users to see updater for their own pledges
	if (parent.pledgerId === currentUserId) {
		if (parent.updaterId === null) {
			return null;
		}

		if (parent.updaterId === currentUserId) {
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			return currentUser;
		}

		const updaterId = parent.updaterId;

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, updaterId),
		});

		if (existingUser === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for a fund campaign pledge's updater id that isn't null.",
			);
			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		return existingUser;
	}

	const [currentUser, existingFundCampaign] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.fundCampaignsTable.findFirst({
			columns: {
				currencyCode: true,
			},
			with: {
				fund: {
					columns: {
						isTaxDeductible: true,
					},
					with: {
						organization: {
							columns: {
								countryCode: true,
							},
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
			where: (fields, operators) => operators.eq(fields.id, parent.campaignId),
		}),
	]);
	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}
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
				message: "Only administrators can perform this action",
			},
		});
	}

	if (parent.updaterId === null) {
		return null;
	}

	if (parent.updaterId === currentUserId) {
		return currentUser;
	}

	const updaterId = parent.updaterId;

	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) => operators.eq(fields.id, updaterId),
	});

	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a fund campaign pledge's updater id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser;
};

FundCampaignPledge.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the fund campaign pledge.",
			resolve: resolveUpdater,
			complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
			type: User,
		}),
	}),
});
