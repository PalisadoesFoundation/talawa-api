import { eq } from "drizzle-orm";
import { z } from "zod";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationJoinPublicOrganizationInput,
	joinPublicOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationJoinPublicOrganizationInput";
import { OrganizationMembershipObject } from "~/src/graphql/types/Organization/OrganizationMembership";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Use the correct import path for OrganizationMembership type
// If it's a GraphQL type referenced from builder, we don't need to import it
// Alternative: import { OrganizationMembership } from "~/src/graphql/types/OrganizationMembership";
const mutationJoinPublicOrganizationArgumentsSchema = z.object({
	input: joinPublicOrganizationInputSchema,
});

builder.mutationField("joinPublicOrganization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input to join a public organization",
				required: true,
				type: MutationJoinPublicOrganizationInput,
			}),
		},
		description: "Mutation field to join a public organization.",
		resolve: async (_parent, args, ctx) => {
			// ✅ Ensure user is authenticated
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// ✅ Validate input schema
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationJoinPublicOrganizationArgumentsSchema.safeParse(args);

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

			// ✅ Check if organization exists
			const organization =
				await ctx.drizzleClient.query.organizationsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				});

			if (!organization) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			// ✅ Check if the user is already a member
			const existingMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, currentUserId),
							operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							),
						),
				});

			if (existingMembership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
								message: "User is already a member of this organization",
							},
						],
					},
				});
			}

			// ✅ Create new membership
			const newMemberships = await ctx.drizzleClient
				.insert(organizationMembershipsTable)
				.values({
					memberId: currentUserId,
					organizationId: parsedArgs.input.organizationId,
					role: "regular",
					// creatorId: currentUserId,
				})
				.returning();

			// ✅ Ensure membership creation was successful
			if (newMemberships.length === 0) {
				throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
			}

			// ✅ Return created membership
			return newMemberships[0];
		},
		type: OrganizationMembershipObject,
	}),
);
