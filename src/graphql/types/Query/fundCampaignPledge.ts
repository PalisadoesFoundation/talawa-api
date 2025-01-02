import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryFundCampaignPledgeInput,
	queryFundCampaignPledgeInputSchema,
} from "~/src/graphql/inputs/QueryFundCampaignPledgeInput";
import { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const queryFundCampaignPledgeArgumentsSchema = z.object({
	input: queryFundCampaignPledgeInputSchema,
});

builder.queryField("fundCampaignPledge", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryFundCampaignPledgeInput,
			}),
		},
		description: "Query field to read a fund campaign pledge.",
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
					message: "Invalid arguments provided.",
				});
			}

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
					message: "Only authenticated users can perform this action.",
				});
			}

			const existingFundCampaignPledge =
				await ctx.drizzleClient.query.fundCampaignPledgesTable.findFirst({
					with: {
						campaign: {
							columns: {
								startAt: true,
							},
							with: {
								fund: {
									with: {
										organization: {
											columns: {
												countryCode: true,
											},
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
				});

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

			return existingFundCampaignPledge;
		},
		type: FundCampaignPledge,
	}),
);
