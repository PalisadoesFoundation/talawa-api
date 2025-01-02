import { z } from "zod";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateFundCampaignInput,
	mutationCreateFundCampaignInputSchema,
} from "~/src/graphql/inputs/MutationCreateFundCampaignInput";
import { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateFundCampaignArgumentsSchema = z.object({
	input: mutationCreateFundCampaignInputSchema,
});

builder.mutationField("createFundCampaign", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateFundCampaignInput,
			}),
		},
		description: "Mutation field to create a fund campaign.",
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
			} = mutationCreateFundCampaignArgumentsSchema.safeParse(args);

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

			const [currentUser, existingFund] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.fundsTable.findFirst({
					columns: {
						isTaxDeductible: true,
					},
					with: {
						fundCampaignsWhereFund: {
							columns: {
								currencyCode: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.name, parsedArgs.input.name),
						},
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.fundId),
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

			if (existingFund === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "fundId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			const existingFundCampaignWithName =
				existingFund.fundCampaignsWhereFund[0];

			if (existingFundCampaignWithName !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "name"],
								message: "This name is not available.",
							},
						],
					},
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingFund.organization.organizationMembershipsWhereOrganization[0];

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
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [createdFundCampaign] = await ctx.drizzleClient
				.insert(fundCampaignsTable)
				.values({
					creatorId: currentUserId,
					currencyCode: parsedArgs.input.currencyCode,
					endAt: parsedArgs.input.endAt,
					fundId: parsedArgs.input.fundId,
					goalAmount: parsedArgs.input.goalAmount,
					name: parsedArgs.input.name,
					startAt: parsedArgs.input.startAt,
				})
				.returning();

			// Inserted fund campaign not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdFundCampaign === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return createdFundCampaign;
		},
		type: FundCampaign,
	}),
);
