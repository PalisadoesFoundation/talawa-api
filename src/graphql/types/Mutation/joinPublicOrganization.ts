import { GraphQLError } from "graphql";
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
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated", message: "User must be authenticated" },
				});
			}

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

			// Check if user exists
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

			if (organization.userRegistrationRequired) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "This organization requires user registration before joining.",
					},
				});
			}

			try {
				const newMemberships = await ctx.drizzleClient.transaction(async (tx) => {
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

				if (newMemberships.length === 0) {
					throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
				}

				return newMemberships[0];
			} catch (error) {
				throw new TalawaGraphQLError({
					extensions: { code: "transaction_failed", message: "Failed to join organization" },
				});
			}
		},
		type: OrganizationMembershipObject,
	}),
);
