import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import {
	MutationSendMembershipRequestInput,
	sendMembershipRequestInputSchema,
} from "~/src/graphql/inputs/MutationSendMembershipRequestInput";
import { MembershipRequestObject } from "~/src/graphql/types/Organization/MembershipRequestObject";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationSendMembershipRequestArgumentsSchema = z.object({
	input: sendMembershipRequestInputSchema,
});

builder.mutationField("sendMembershipRequest", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input to send a membership request",
				required: true,
				type: MutationSendMembershipRequestInput,
			}),
		},
		description:
			"Mutation field to send a membership request to an organization.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationSendMembershipRequestArgumentsSchema.safeParse(args);

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

			const existingRequest =
				await ctx.drizzleClient.query.membershipRequestsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, currentUserId),
							operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							),
						),
				});

			if (existingRequest) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
								message:
									"User has already sent a membership request to this organization.",
							},
						],
					},
				});
			}

			if (organization.userRegistrationRequired) {
				const newRequest = await ctx.drizzleClient
					.insert(membershipRequestsTable)
					.values({
						userId: currentUserId,
						organizationId: parsedArgs.input.organizationId,
					})
					.returning();

				if (newRequest.length === 0) {
					throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
				}

				return newRequest[0];
			}

			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action",
					message:
						"This organization does not require registration, automatic approval logic should be handled here.",
				},
			});
		},
		type: MembershipRequestObject,
	}),
);
