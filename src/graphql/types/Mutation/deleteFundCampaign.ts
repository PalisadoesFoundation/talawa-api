import { eq } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteFundCampaignInput,
	mutationDeleteFundCampaignInputSchema,
} from "~/src/graphql/inputs/MutationDeleteFundCampaignInput";
import { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationDeleteFundCampaignArgumentsSchema = z.object({
	input: mutationDeleteFundCampaignInputSchema,
});

builder.mutationField("deleteFundCampaign", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteFundCampaignInput,
			}),
		},
		description: "Mutation field to delete a fund campaign.",
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
			} = mutationDeleteFundCampaignArgumentsSchema.safeParse(args);

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

			if (existingFundCampaign === undefined) {
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
				existingFundCampaign.fund.organization
					.organizationMembershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
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

			const [deletedFundCampaign] = await ctx.drizzleClient
				.delete(fundCampaignsTable)
				.where(eq(fundCampaignsTable.id, parsedArgs.input.id))
				.returning();

			// Deleted fund campaign not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedFundCampaign === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return deletedFundCampaign;
		},
		type: FundCampaign,
	}),
);
