import { eq } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import {
	MutationCancelMembershipRequestInput,
	cancelMembershipRequestInputSchema,
} from "~/src/graphql/inputs/MutationCancelMembershipRequestInput";
import { CancelMembershipResponse } from "~/src/graphql/types/Organization/CancelMembershipResponse"; // Updated to use new response type
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Input schema for canceling the membership request
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

			const membershipRequest =
				await ctx.drizzleClient.query.membershipRequestsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(
								fields.membershipRequestId, // ✅ Corrected to camelCase
								parsedArgs.input.membershipRequestId,
							),
							operators.eq(fields.userId, currentUserId), // ✅ Corrected to camelCase
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

			const deletedRequest = await ctx.drizzleClient
				.delete(membershipRequestsTable)
				.where(
					eq(
						membershipRequestsTable.membershipRequestId, // ✅ Corrected to camelCase
						parsedArgs.input.membershipRequestId,
					),
				)
				.returning();

			// ✅ Ensure the request was deleted successfully
			if (deletedRequest.length === 0) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			// ✅ Return success message with CancelMembershipResponse type
			return {
				success: true,
				message: "Membership request canceled successfully.",
			};
		},
		type: CancelMembershipResponse, // Use the updated response type
	}),
);
