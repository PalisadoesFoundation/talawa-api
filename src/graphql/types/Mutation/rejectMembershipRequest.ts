import { eq } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import {
	MutationRejectMembershipRequestInput,
	rejectMembershipRequestInputSchema,
} from "~/src/graphql/inputs/MutationRejectMembershipRequestInput";
import { RejectMembershipResponse } from "~/src/graphql/types/Organization/RejectMembershipResponse";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationRejectMembershipRequestArgumentsSchema = z.object({
	input: rejectMembershipRequestInputSchema,
});

builder.mutationField("rejectMembershipRequest", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input to reject a membership request",
				required: true,
				type: MutationRejectMembershipRequestInput,
			}),
		},
		description: "Mutation field to reject a membership request by an admin.",
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
			} = mutationRejectMembershipRequestArgumentsSchema.safeParse(args);

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

			const [currentUser, membershipRequest] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.membershipRequestsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(
							fields.membershipRequestId,
							parsedArgs.input.membershipRequestId,
						),
					with: {
						organization: {
							columns: {
								name: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
				}),
			]);

			if (!membershipRequest) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["membershipRequestId"] }],
					},
				});
			}

			const currentUserOrganizationMembership =
				membershipRequest.organization.membershipsWhereOrganization[0];

			if (
				currentUser?.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						message:
							"You must be an organization admin or system admin to reject membership requests.",
						issues: [{ argumentPath: ["membershipRequestId"] }],
					},
				});
			}

			if (membershipRequest.status !== "pending") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "You can only reject a pending membership request.",
					},
				});
			}

			const updatedRequest = await ctx.drizzleClient
				.update(membershipRequestsTable)
				.set({ status: "rejected" })
				.where(
					eq(
						membershipRequestsTable.membershipRequestId,
						parsedArgs.input.membershipRequestId,
					),
				)
				.returning();

			if (updatedRequest.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message: "Failed to reject the membership request.",
					},
				});
			}

			return {
				success: true,
				message: "Membership request rejected successfully.",
			};
		},
		type: RejectMembershipResponse,
	}),
);
