import { GraphQLError } from "graphql"; // New import
import { z } from "zod";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationJoinPublicOrganizationInput,
	joinPublicOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationJoinPublicOrganizationInput";
import { OrganizationMembershipObject } from "~/src/graphql/types/Organization/OrganizationMembership";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
			// Ensure user is authenticated
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// Validate input schema
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

			// Check if user exists in the database
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});
			if (!user) {
				throw new GraphQLError("User not found", {
					extensions: { code: "unauthenticated" },
				});
			}

			// Check if organization exists
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

			// Check if organization requires user registration before joining
			if (organization.userRegistrationRequired) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message:
							"This organization requires user registration before joining.",
					},
				});
			}

			// Begin a transaction
			const newMemberships = await ctx.drizzleClient.transaction(async (tx) => {
				// Check if the user is already a member (within the transaction)
				const existingMembership =
					await tx.query.organizationMembershipsTable.findFirst({
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

				// Create the new membership inside the transaction
				return await tx
					.insert(organizationMembershipsTable)
					.values({
						memberId: currentUserId,
						organizationId: parsedArgs.input.organizationId,
						role: "regular",
						creatorId: currentUserId,
					})
					.returning();
			});

			// Ensure membership creation was successful
			if (newMemberships.length === 0) {
				throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
			}

			// Return created membership
			return newMemberships[0];
		},
		type: OrganizationMembershipObject,
	}),
);
