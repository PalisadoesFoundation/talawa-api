import { eq } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateFundCampaignPledgeInput,
	mutationUpdateFundCampaignPledgeInputSchema,
} from "~/src/graphql/inputs/MutationUpdateFundCampaignPledgeInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateFundCampaignPledgeArgumentsSchema = z.object({
	input: mutationUpdateFundCampaignPledgeInputSchema,
});

builder.mutationField("updateFundCampaignPledge", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateFundCampaignPledgeInput,
			}),
		},
		description: "Mutation field to update a fund campaign pledge.",
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
			} = mutationUpdateFundCampaignPledgeArgumentsSchema.safeParse(args);

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
				existingFundCampaignPledge.campaign.fund.organization
					.membershipsWhereOrganization[0];

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

			const [updatedFundCampaignPledge] = await ctx.drizzleClient
				.update(fundCampaignPledgesTable)
				.set({
					amount: parsedArgs.input.amount,
					note: parsedArgs.input.note,
					updaterId: currentUserId,
				})
				.where(eq(fundCampaignPledgesTable.id, parsedArgs.input.id))
				.returning();

			// Updated fund campaign pledge not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedFundCampaignPledge === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedFundCampaignPledge;
		},
		type: FundCampaignPledge,
	}),
);
