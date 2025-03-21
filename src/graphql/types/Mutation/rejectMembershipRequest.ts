import { eq } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
// Create new input type for this mutation
const rejectMembershipRequestInputSchema = z.object({
	membershipRequestId: z
		.string()
		.uuid("Membership request ID must be a valid UUID"),
});

const MutationRejectMembershipRequestInput = builder.inputType(
	"MutationRejectMembershipRequestInput",
	{
		fields: (t) => ({
			membershipRequestId: t.field({
				type: "ID",
				required: true,
				description: "ID of the membership request to reject",
			}),
		}),
	},
);

const mutationRejectMembershipRequestArgumentsSchema = z.object({
	input: rejectMembershipRequestInputSchema,
});

// Create a response type for this mutation
const RejectMembershipResponse = builder.objectRef<{
	success: boolean;
	message: string;
}>("RejectMembershipResponse");

RejectMembershipResponse.implement({
	fields: (t) => ({
		success: t.exposeBoolean("success", {
			description: "Whether the operation was successful",
		}),
		message: t.exposeString("message", {
			description: "Success or error message",
		}),
	}),
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
              
              // Get organization membership if exists
              const currentUserOrganizationMembership = 
                membershipRequest.organization.membershipsWhereOrganization[0];
              
              // Check if the user is either a system admin or an organization admin
              if (
                currentUser?.role !== "administrator" &&
                (currentUserOrganizationMembership === undefined ||
                 currentUserOrganizationMembership.role !== "administrator")
              ) {
                throw new TalawaGraphQLError({
                  extensions: {
                    code: "unauthorized_action_on_arguments_associated_resources",
                    message: "You must be an organization admin or system admin to reject membership requests.",
                    issues: [{ argumentPath: ["membershipRequestId"] }],
                  },
                });
              }

			// ✅ Ensure the request is in a 'pending' status before rejecting
			if (membershipRequest.status !== "pending") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "You can only reject a pending membership request.",
					},
				});
			}

			// ✅ Update the request status to 'rejected'
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
