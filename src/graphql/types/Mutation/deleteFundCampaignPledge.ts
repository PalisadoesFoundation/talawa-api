import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteFundCampaignPledgeInput,
	mutationDeleteFundCampaignPledgeInputSchema,
} from "~/src/graphql/inputs/MutationDeleteFundCampaignPledgeInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteFundCampaignPledgeArgumentsSchema = z.object({
	input: mutationDeleteFundCampaignPledgeInputSchema,
});

builder.mutationField("deleteFundCampaignPledge", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteFundCampaignPledgeInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete a fund campaign pledge.",
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
			} = mutationDeleteFundCampaignPledgeArgumentsSchema.safeParse(args);

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

			const [currentUser, existingFundCampaignPledge] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.fundCampaignPledgesTable.findFirst({
					columns: {
						pledgerId: true,
						amount: true,
						campaignId: true,
					},
					with: {
						campaign: {
							columns: {
								startAt: true,
							},
							with: {
								fund: {
									columns: {
										isTaxDeductible: true,
										organizationId: true,
									},
									with: {
										organization: {
											columns: {
												countryCode: true,
											},
										},
									},
								},
							},
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingFundCampaignPledge === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(
								fields.organizationId,
								existingFundCampaignPledge.campaign.fund.organizationId,
							),
							operators.eq(fields.memberId, currentUserId),
						),
				});

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						currentUserId !== existingFundCampaignPledge.pledgerId))
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const deletedFundCampaignPledge = await ctx.drizzleClient.transaction(
				async (tx) => {
					const [deletedPledge] = await tx
						.delete(fundCampaignPledgesTable)
						.where(eq(fundCampaignPledgesTable.id, parsedArgs.input.id))
						.returning();

					if (deletedPledge === undefined) {
						tx.rollback();
						return;
					}

					await tx
						.update(fundCampaignsTable)
						.set({
							amountRaised: sql`${fundCampaignsTable.amountRaised} - ${deletedPledge.amount}`,
						})
						.where(eq(fundCampaignsTable.id, deletedPledge.campaignId));

					return deletedPledge;
				},
			);

			// Deleted fund campaign pledge not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedFundCampaignPledge === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedFundCampaignPledge;
		},
		type: FundCampaignPledge,
	}),
);
