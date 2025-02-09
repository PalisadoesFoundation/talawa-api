import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { FundCampaignPledge } from "./FundCampaignPledge";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

export const resolveUpdater = async (
	parent: FundCampaignPledge,
	_args: Record<string, never>,
	ctx: ContextType,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

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
			type: User,
		}),
	}),
});
