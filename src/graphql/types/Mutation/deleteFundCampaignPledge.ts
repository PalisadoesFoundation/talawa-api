import { eq } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteFundCampaignPledgeInput,
	mutationDeleteFundCampaignPledgeInputSchema,
} from "~/src/graphql/inputs/MutationDeleteFundCampaignPledgeInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
		description: "Mutation field to delete a fund campaign pledge.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
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
					message: "Invalid arguments provided.",
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingFundCampaignPledge.campaign.fund.organization
					.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [deletedFundCampaignPledge] = await ctx.drizzleClient
				.delete(fundCampaignPledgesTable)
				.where(eq(fundCampaignPledgesTable.id, parsedArgs.input.id))
				.returning();

			// Deleted fund campaign pledge not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedFundCampaignPledge === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return deletedFundCampaignPledge;
		},
		type: FundCampaignPledge,
	}),
);
