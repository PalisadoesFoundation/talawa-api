import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateFundCampaignPledgeInput,
	mutationCreateFundCampaignPledgeInputSchema,
} from "~/src/graphql/inputs/MutationCreateFundCampaignPledgeInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateFundCampaignPledgeArgumentsSchema = z.object({
	input: mutationCreateFundCampaignPledgeInputSchema,
});

builder.mutationField("createFundCampaignPledge", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateFundCampaignPledgeInput,
			}),
		},
		description: "Mutation field to create a fund campaign pledge.",
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
			} = mutationCreateFundCampaignPledgeArgumentsSchema.safeParse(args);

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

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingFundCampaign, existingPledger] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.fundCampaignsTable.findFirst({
						columns: {
							endAt: true,
							startAt: true,
						},
						with: {
							fundCampaignPledgesWhereCampaign: {
								where: (fields, operators) =>
									operators.eq(fields.pledgerId, parsedArgs.input.pledgerId),
							},
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
													memberId: true,
													role: true,
												},
												where: (fields, operators) =>
													operators.inArray(fields.memberId, [
														currentUserId,
														parsedArgs.input.pledgerId,
													]),
											},
										},
									},
								},
							},
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.campaignId),
					}),
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.pledgerId),
					}),
				]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingFundCampaign === undefined && existingPledger === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "campaignId"],
							},
							{
								argumentPath: ["input", "pledgerId"],
							},
						],
					},
				});
			}

			if (existingFundCampaign === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "campaignId"],
							},
						],
					},
				});
			}

			if (existingPledger === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "pledgerId"],
							},
						],
					},
				});
			}

			const existingFundCampaignPledge =
				existingFundCampaign.fundCampaignPledgesWhereCampaign[0];

			if (existingFundCampaignPledge !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "campaignId"],
								message:
									"This fund campaign has already been pledged to by the user trying to pledge.",
							},
							{
								argumentPath: ["input", "pledgerId"],
								message: "This user has already pledged to the fund campaign.",
							},
						],
					},
				});
			}

			if (existingFundCampaign.endAt.getTime() <= Date.now()) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "campaignId"],
								message: "This fund campaign has ended.",
							},
						],
					},
				});
			}

			if (existingFundCampaign.startAt.getTime() > Date.now()) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "campaignId"],
								message: "This fund campaign has not started yet.",
							},
						],
					},
				});
			}

			const [currentUserOrganizationMembership, pledgerOrganizationMembership] =
				[currentUserId, parsedArgs.input.pledgerId].map((id) =>
					existingFundCampaign.fund.organization.membershipsWhereOrganization.find(
						(membership) => membership.memberId === id,
					),
				);

			if (currentUser.role === "administrator") {
				if (
					currentUserId !== parsedArgs.input.pledgerId &&
					pledgerOrganizationMembership === undefined
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "pledgerId"],
									message:
										"This user is not a member of the organization associated to the fund campaign.",
								},
							],
						},
					});
				}
			} else {
				if (currentUserOrganizationMembership === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "campaignId"],
								},
							],
						},
					});
				}

				if (currentUserOrganizationMembership.role === "administrator") {
					if (
						currentUserId !== parsedArgs.input.pledgerId &&
						pledgerOrganizationMembership === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "forbidden_action_on_arguments_associated_resources",
								issues: [
									{
										argumentPath: ["input", "pledgerId"],
										message:
											"This user is not a member of the organization associated to the fund campaign.",
									},
								],
							},
						});
					}
				} else {
					if (currentUserId !== parsedArgs.input.pledgerId) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: [
									{
										argumentPath: ["input", "campaignId"],
									},
								],
							},
						});
					}
				}
			}

			const [createdFundCampaignPledge] = await ctx.drizzleClient
				.insert(fundCampaignPledgesTable)
				.values({
					amount: parsedArgs.input.amount,
					campaignId: parsedArgs.input.campaignId,
					creatorId: currentUserId,
					id: uuidv7(),
					note: parsedArgs.input.note,
					pledgerId: parsedArgs.input.pledgerId,
				})
				.returning();

			// Inserted fund campaign pledge not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdFundCampaignPledge === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdFundCampaignPledge;
		},
		type: FundCampaignPledge,
	}),
);
