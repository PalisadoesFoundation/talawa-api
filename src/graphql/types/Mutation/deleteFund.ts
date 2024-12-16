import { eq } from "drizzle-orm";
import { z } from "zod";
import { fundsTable } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteFundInput,
	mutationDeleteFundInputSchema,
} from "~/src/graphql/inputs/MutationDeleteFundInput";
import { Fund } from "~/src/graphql/types/Fund/Fund";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationDeleteFundArgumentsSchema = z.object({
	input: mutationDeleteFundInputSchema,
});

builder.mutationField("deleteFund", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteFundInput,
			}),
		},
		description: "Mutation field to delete a fund.",
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
			} = mutationDeleteFundArgumentsSchema.safeParse(args);

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

			if (existingFund === undefined) {
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
								argumentPath: ["input", "id"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [deletedFund] = await ctx.drizzleClient
				.delete(fundsTable)
				.where(eq(fundsTable.id, parsedArgs.input.id))
				.returning();

			// Deleted fund not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedFund === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return deletedFund;
		},
		type: Fund,
	}),
);
