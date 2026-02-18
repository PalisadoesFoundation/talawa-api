import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	FundCampaignPledge,
	type FundCampaignPledge as FundCampaignPledgeType,
} from "./FundCampaignPledge";

export const pledgerResolver = async (
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

	const fetchCurrentUser = async (ctx: GraphQLContext, userId: string) => {
		const user = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, userId),
		});
		if (user === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		return user;
	};

	// Allow users to see pledger for their own pledges
	if (parent.pledgerId === currentUserId) {
		return fetchCurrentUser(ctx, currentUserId);
	}

	const [currentUser, existingFundCampaign] = await Promise.all([
		fetchCurrentUser(ctx, currentUserId),
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
		currentUserOrganizationMembership === undefined
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	const pledgerId = parent.pledgerId;

	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) => operators.eq(fields.id, pledgerId),
	});

	// Pledger id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a fund campaign pledge's pledger id that isn't null.",
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
		pledger: t.field({
			description: "User on whose behalf the fund campaign pledge is created.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: pledgerResolver,
			type: User,
		}),
	}),
});
