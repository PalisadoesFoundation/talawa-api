import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteOrganizationMembershipInput,
	mutationDeleteOrganizationMembershipInputSchema,
} from "~/src/graphql/inputs/MutationDeleteOrganizationMembershipInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationDeleteOrganizationMembershipArgumentsSchema = z.object({
	input: mutationDeleteOrganizationMembershipInputSchema,
});

builder.mutationField("deleteOrganizationMembership", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteOrganizationMembershipInput,
			}),
		},
		description: "Mutation field to delete an organization membership.",
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
				success,
				data: parsedArgs,
				error,
			} = mutationDeleteOrganizationMembershipArgumentsSchema.safeParse(args);

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

			const [
				currentUser,
				existingMember,
				existingOrganization,
				existingOrganizationMembership,
			] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.memberId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					with: {
						organizationMembershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				}),
				ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, parsedArgs.input.memberId),
							operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							),
						),
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

			if (existingMember === undefined && existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (existingMember === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (existingOrganizationMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (currentUser.role !== "administrator") {
				const currentUserOrganizationMembership =
					existingOrganization.organizationMembershipsWhereOrganization[0];

				if (
					currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						currentUserId !== parsedArgs.input.memberId)
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "memberId"],
								},
								{
									argumentPath: ["input", "organizationId"],
								},
							],
						},
						message:
							"You are not authorized to perform this action on the resources associated to the provided arguments.",
					});
				}
			}

			const [deletedOrganizationMembership] = await ctx.drizzleClient
				.delete(organizationMembershipsTable)
				.where(
					and(
						eq(
							organizationMembershipsTable.memberId,
							parsedArgs.input.memberId,
						),
						eq(
							organizationMembershipsTable.organizationId,
							parsedArgs.input.organizationId,
						),
					),
				)
				.returning();

			// Deleted organization membership not being returned means that either it was deleted or its `member_id` column or `organization_id` column or both were changed by external entities before this delete operation could take place.
			if (deletedOrganizationMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return existingOrganization;
		},
		type: Organization,
	}),
);
