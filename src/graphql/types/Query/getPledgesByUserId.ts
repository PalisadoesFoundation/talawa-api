import { and, asc, desc, eq, exists, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	QueryFundCampaignPledgesByUserInput,
	QueryPledgeOrderByInput,
	QueryPledgeWhereInput,
	queryFundCampaignPledgesByUserInputSchema,
} from "~/src/graphql/inputs/QueryFundCampaignPledgeInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import envConfig from "~/src/utilities/graphqLimits";
import type { ParsedDefaultGraphQLConnectionArgumentsWithWhere } from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryFundCampaignPledgeArgumentsSchema = z.object({
	input: queryFundCampaignPledgesByUserInputSchema,
});

export const queryFundCampaignPledgesByUser = builder.queryField(
	"getPledgesByUserId",
	(t) =>
		t.field({
			args: {
				input: t.arg({
					description: "Input parameters to fetch pledges by userId.",
					required: true,
					type: QueryFundCampaignPledgesByUserInput,
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
				limit: t.arg({
					description: "Maximum number of results to return.",
					required: false,
					type: "Int",
				}),
				offset: t.arg({
					description: "Number of results to skip.",
					required: false,
					type: "Int",
				}),
			},
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			description:
				"Query field to get fund campaign pledges associated with a user.",
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

				const userId = parsedArgs.input.userId;
				const currentUserId = ctx.currentClient.user.id;

				const [currentUser, targetUser] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							id: true,
						},
						where: (fields, operators) => operators.eq(fields.id, userId),
					}),
				]);

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Validate that the target user exists
				if (targetUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "userId"] }],
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

				type SortablePledge = { campaign: { endAt: Date | string } };
				let sortInTs:
					| ((a: SortablePledge, b: SortablePledge) => number)
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
				const fundCampaignPledgesQueryBuilder =
					ctx.drizzleClient.query.fundCampaignPledgesTable.findMany({
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
															operators.eq(fields.memberId, currentUserId),
													},
												},
											},
										},
									},
								},
							},
						},
						where: (pledges, { and: andOp }) => {
							const conditions = [eq(pledges.pledgerId, userId)];
							if (
								where?.name_contains !== undefined ||
								where?.firstName_contains !== undefined
							) {
								conditions.push(
									exists(
										ctx.drizzleClient
											.select()
											.from(fundCampaignsTable)
											.leftJoin(
												usersTable,
												eq(usersTable.id, pledges.pledgerId),
											)
											.where(
												and(
													eq(fundCampaignsTable.id, pledges.campaignId),
													or(
														where?.name_contains !== undefined
															? ilike(
																	fundCampaignsTable.name,
																	`%${where.name_contains}%`,
																)
															: undefined,
														where?.firstName_contains !== undefined
															? ilike(
																	usersTable.name,
																	`%${where.firstName_contains}%`,
																)
															: undefined,
													),
												),
											),
									),
								);
							}
							return andOp(...conditions);
						},
						orderBy: orderBy,
						limit: sortInTs ? undefined : (args.limit ?? undefined),
						offset: sortInTs ? undefined : (args.offset ?? undefined),
					});

				// Execute the query
				const fundCampaignPledges = await fundCampaignPledgesQueryBuilder;

				// Perform in-memory sorting as nested sort still not supported in drizzle see https://github.com/drizzle-team/drizzle-orm/issues/2297 and https://www.answeroverflow.com/m/1240834016140066896
				if (sortInTs) {
					fundCampaignPledges.sort(sortInTs);
					const start = (args.offset as number | undefined) ?? 0;
					const end =
						(args.limit as number | undefined) !== undefined
							? start + (args.limit as number)
							: undefined;
					return fundCampaignPledges.slice(start, end);
				}

				if (!fundCampaignPledges.length) {
					// If filters were applied but no results found, throw an error
					if (
						where?.name_contains !== undefined ||
						where?.firstName_contains !== undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [{ argumentPath: ["input", "userId"] }],
							},
						});
					}
					return [];
				}

				// Check permissions
				// If current user is the target user, they can see their own pledges
				if (currentUserId === userId) {
					return fundCampaignPledges;
				}

				// If current user is an admin, they can see any user's pledges
				if (currentUser.role === "administrator") {
					return fundCampaignPledges;
				}

				// Check if current user is admin in the organization of the pledges
				const currentUserOrgMembership =
					fundCampaignPledges[0]?.campaign?.fund?.organization
						?.membershipsWhereOrganization?.[0];

				if (currentUserOrgMembership?.role !== "administrator") {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "userId"] }],
						},
					});
				}

				return fundCampaignPledges;
			},
			type: [FundCampaignPledge],
		}),
);
