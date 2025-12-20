import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { FundCampaignPledge } from "./FundCampaignPledge";

export const createdAtResolver = async (
	parent: FundCampaignPledge,
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
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.createdAt;
};

FundCampaignPledge.implement({
	fields: (t) => ({
		createdAt: t.field({
			description:
				"Date time at the time the fund campaign pledge was created.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: createdAtResolver,
			type: "DateTime",
		}),
	}),
});
