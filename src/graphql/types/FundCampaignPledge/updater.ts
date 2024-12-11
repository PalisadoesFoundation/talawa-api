import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { FundCampaignPledge } from "./FundCampaignPledge";

FundCampaignPledge.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the fund campaign pledge.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const [currentUser, existingFundCampaign] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
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
											organizationMembershipsWhereOrganization: {
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
						where: (fields, operators) =>
							operators.eq(fields.id, parent.campaignId),
					}),
				]);

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				// Fund campaign id existing but the associated fund campaign not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingFundCampaign === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a fund campaign pledge's campaign id that isn't null.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				const currentUserOrganizationMembership =
					existingFundCampaign.fund.organization
						.organizationMembershipsWhereOrganization[0];

				if (
					currentUser.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						currentUserOrganizationMembership.role !== "administrator")
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
						message: "You are not authorized to perform this action.",
					});
				}

				if (parent.updaterId === null) {
					return null;
				}

				if (parent.updaterId === currentUserId) {
					return currentUser;
				}

				const updaterId = parent.updaterId;

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, updaterId),
					},
				);

				// Updater id existing but the associated user not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a fund campaign pledge's updater id that isn't null.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return existingUser;
			},
			type: User,
		}),
	}),
});
