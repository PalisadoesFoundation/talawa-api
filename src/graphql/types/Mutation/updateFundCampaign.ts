import { eq } from "drizzle-orm";
import { z } from "zod";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateFundCampaignInput,
	mutationUpdateFundCampaignInputSchema,
} from "~/src/graphql/inputs/MutationUpdateFundCampaignInput";
import { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateFundCampaignArgumentsSchema = z.object({
	input: mutationUpdateFundCampaignInputSchema,
});

builder.mutationField("updateFundCampaign", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateFundCampaignInput,
			}),
		},
		description: "Mutation field to update a fund campaign.",
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
			} = mutationUpdateFundCampaignArgumentsSchema.safeParse(args);

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
					columns: {
						endAt: true,
						fundId: true,
						startAt: true,
					},
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

			if (
				parsedArgs.input.endAt === undefined &&
				parsedArgs.input.startAt !== undefined &&
				existingFundCampaign.endAt <= parsedArgs.input.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "startAt"],
								message: `Must be smaller than the value: ${parsedArgs.input.startAt.toISOString()}`,
							},
						],
					},
					message: "Invalid arguments provided.",
				});
			}

			if (
				parsedArgs.input.endAt !== undefined &&
				parsedArgs.input.startAt === undefined &&
				parsedArgs.input.endAt <= existingFundCampaign.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "endAt"],
								message: `Must be greater than the value: ${parsedArgs.input.endAt.toISOString()}`,
							},
						],
					},
					message: "Invalid arguments provided.",
				});
			}

			if (parsedArgs.input.name !== undefined) {
				const name = parsedArgs.input.name;

				const existingFundCampaignWithName =
					await ctx.drizzleClient.query.fundCampaignsTable.findFirst({
						columns: {},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.fundId, existingFundCampaign.fundId),
								operators.eq(fields.name, name),
							),
					});

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

			const [updatedFundCampaign] = await ctx.drizzleClient
				.update(fundCampaignsTable)
				.set({
					currencyCode: parsedArgs.input.currencyCode,
					endAt: parsedArgs.input.endAt,
					goalAmount: parsedArgs.input.goalAmount,
					name: parsedArgs.input.name,
					startAt: parsedArgs.input.startAt,
				})
				.where(eq(fundCampaignsTable.id, parsedArgs.input.id))
				.returning();

			// Updated fund campaign not being returned means that either it was updated or its `id` column was changed by external entities before this update operation could take place.
			if (updatedFundCampaign === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return updatedFundCampaign;
		},
		type: FundCampaign,
	}),
);
