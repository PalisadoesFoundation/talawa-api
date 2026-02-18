import { eq } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import {
	cancelMembershipRequestInputSchema,
	MutationCancelMembershipRequestInput,
} from "~/src/graphql/inputs/MutationCancelMembershipRequestInput";
import { CancelMembershipResponse } from "~/src/graphql/types/Organization/CancelMembershipResponse";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCancelMembershipRequestArgumentsSchema = z.object({
	input: cancelMembershipRequestInputSchema,
});

builder.mutationField("cancelMembershipRequest", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input to cancel a membership request",
				required: true,
				type: MutationCancelMembershipRequestInput,
			}),
		},
		description: "Mutation field to cancel a membership request.",
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
			} = mutationCancelMembershipRequestArgumentsSchema.safeParse(args);

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

			// ✅ Check if the membership request exists
			const membershipRequest =
				await ctx.drizzleClient.query.membershipRequestsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(
								fields.membershipRequestId,
								parsedArgs.input.membershipRequestId,
							),
							operators.eq(fields.userId, currentUserId),
						),
				});

			if (!membershipRequest) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message:
							"Membership request not found or you do not have permission to cancel it.",
					},
				});
			}

			// ✅ Ensure the request is in a 'pending' status before canceling
			if (membershipRequest.status !== "pending") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "You can only cancel a pending membership request.",
					},
				});
			}

			// ✅ Proceed with deleting the request if status is 'pending'
			const deletedRequest = await ctx.drizzleClient
				.delete(membershipRequestsTable)
				.where(
					eq(
						membershipRequestsTable.membershipRequestId,
						parsedArgs.input.membershipRequestId,
					),
				)
				.returning();

			if (deletedRequest.length === 0) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			return {
				success: true,
				message: "Membership request canceled successfully.",
			};
		},
		type: CancelMembershipResponse,
	}),
);
