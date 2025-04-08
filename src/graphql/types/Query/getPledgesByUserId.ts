import { type SQL, and, asc, desc, eq, exists, ilike } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	QueryPledgeOrderByInput,
	QueryPledgeWhereInput,
} from "~/src/graphql/inputs/QueryFundCampaignPledgeInput";
import {
	QueryUserInput,
	queryUserInputSchema,
} from "~/src/graphql/inputs/QueryUserInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { ParsedDefaultGraphQLConnectionArgumentsWithWhere } from "~/src/utilities/defaultGraphQLConnection";

const queryFundCampaignPledgeArgumentsSchema = z.object({
	userId: queryUserInputSchema,
});

builder.queryField("getPledgesByUserId", (t) =>
	t.field({
		args: {
			userId: t.arg({
				description: "Global id of the user.",
				required: true,
				type: QueryUserInput,
			}),
			where: t.arg({
				description: "Filter criteria for pledges",
				required: false,
				type: QueryPledgeWhereInput,
			}),
			orderBy: t.arg({
				description:
					"Sorting criteria, e.g., 'amount_ASC', 'amount_DESC', 'endDate_ASC', 'endDate_DESC'",
				required: false,
				type: QueryPledgeOrderByInput,
			}),
		},
		description:
			"Query field to get fund campaign pledge associated to a user.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryFundCampaignPledgeArgumentsSchema.safeParse(args);
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

			const UserId = parsedArgs.userId.id;
			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Order By
			const sortOrder = args.orderBy as
				| "amount_ASC"
				| "amount_DESC"
				| "endDate_ASC"
				| "endDate_DESC"
				| undefined;

			let orderBy: SQL<unknown>[] = [];

			// As FundCampaignPledge type does not contain campaign
			interface ExtendedFundCampaignPledge extends FundCampaignPledge {
				campaign: {
					endAt: Date;
				};
			}

			let sortInTs:
				| ((
						a: ExtendedFundCampaignPledge,
						b: ExtendedFundCampaignPledge,
				  ) => number)
				| null = null;

			switch (sortOrder) {
				case "amount_ASC":
					orderBy = [asc(fundCampaignPledgesTable.amount)];
					break;
				case "amount_DESC":
					orderBy = [desc(fundCampaignPledgesTable.amount)];
					break;
				case "endDate_ASC":
					sortInTs = (a, b) =>
						new Date(a.campaign.endAt).getTime() -
						new Date(b.campaign.endAt).getTime();
					break;
				case "endDate_DESC":
					sortInTs = (a, b) =>
						new Date(b.campaign.endAt).getTime() -
						new Date(a.campaign.endAt).getTime();
					break;
				default:
					orderBy = [];
			}

			// Where Clause
			const { where } =
				args as unknown as ParsedDefaultGraphQLConnectionArgumentsWithWhere<
					{ createdAt: Date; id: string },
					{
						name_contains?: string;
						firstName_contains?: string;
					}
				>;

			// Query
			const existingFundCampaignPledge =
				await ctx.drizzleClient.query.fundCampaignPledgesTable.findMany({
					with: {
						pledger: {
							columns: {
								id: true,
								name: true,
								avatarName: true,
							},
						},
						campaign: {
							columns: {
								name: true,
								startAt: true,
								endAt: true,
								currencyCode: true,
							},
							with: {
								fund: {
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
														operators.eq(fields.memberId, UserId),
												},
											},
										},
									},
								},
							},
						},
					},
					where: (pledges, { and: andOp }) => {
						// base condition
						const conditions = [eq(pledges.pledgerId, UserId)];

						// campaign name filter
						if (where?.name_contains !== undefined) {
							conditions.push(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundCampaignsTable)
										.where(
											and(
												eq(fundCampaignsTable.id, pledges.campaignId),
												ilike(
													fundCampaignsTable.name,
													`%${where.name_contains}%`,
												),
											),
										),
								),
							);
						}

						// user name filter
						if (where?.firstName_contains !== undefined) {
							conditions.push(
								exists(
									ctx.drizzleClient
										.select()
										.from(usersTable)
										.where(
											and(
												eq(usersTable.id, pledges.pledgerId),
												ilike(usersTable.name, `%${where.firstName_contains}%`),
											),
										),
								),
							);
						}
						return andOp(...conditions);
					},
					orderBy: orderBy,
				});

			// Perform in-memory sorting as nested sort still not supported in drizzle see https://github.com/drizzle-team/drizzle-orm/issues/2297
			if (sortInTs) {
				existingFundCampaignPledge.sort(sortInTs);
			}

			if (!existingFundCampaignPledge.length) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["userId", "id"],
							},
						],
					},
				});
			}

			const firstPledge = existingFundCampaignPledge[0];
			const currentUserOrganizationMembership =
				firstPledge?.campaign.fund.organization
					.membershipsWhereOrganization?.[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						currentUserId !== firstPledge?.pledgerId))
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["userId", "id"],
							},
						],
					},
				});
			}

			return existingFundCampaignPledge;
		},
		type: [FundCampaignPledge],
	}),
);
