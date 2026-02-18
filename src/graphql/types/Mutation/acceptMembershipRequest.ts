import { eq } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	acceptMembershipRequestInputSchema,
	MutationAcceptMembershipRequestInput,
} from "~/src/graphql/inputs/MutationAcceptMembershipRequestInput";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import { AcceptMembershipResponse } from "~/src/graphql/types/Organization/AcceptMembershipResponse";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationAcceptMembershipRequestArgumentsSchema = z.object({
	input: acceptMembershipRequestInputSchema,
});

builder.mutationField("acceptMembershipRequest", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input to accept a membership request",
				required: true,
				type: MutationAcceptMembershipRequestInput,
			}),
		},
		description: "Mutation field to accept a membership request by an admin.",
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
			} = mutationAcceptMembershipRequestArgumentsSchema.safeParse(args);

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
						user: {
							columns: {
								name: true,
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
							"You must be an organization admin or system admin to accept membership requests.",
						issues: [{ argumentPath: ["membershipRequestId"] }],
					},
				});
			}

			if (membershipRequest.status !== "pending") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "You can only accept a pending membership request.",
					},
				});
			}

			const existingMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(
								fields.organizationId,
								membershipRequest.organizationId,
							),
							operators.eq(fields.memberId, membershipRequest.userId),
						),
				});

			if (existingMembership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "The user is already a member of this organization.",
					},
				});
			}

			try {
				await ctx.drizzleClient.transaction(async (tx) => {
					const updatedRequest = await tx
						.update(membershipRequestsTable)
						.set({ status: "approved" })
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
								message: "Failed to accept the membership request.",
							},
						});
					}

					await tx
						.insert(organizationMembershipsTable)
						.values({
							memberId: membershipRequest.userId,
							organizationId: membershipRequest.organizationId,
							role: "regular",
							creatorId: currentUserId,
							createdAt: new Date(),
						})
						.returning();
				});

				// Notify the user about membership acceptance
				notificationEventBus.emitMembershipRequestAccepted(
					{
						userId: membershipRequest.userId,
						organizationId: membershipRequest.organizationId,
						organizationName: membershipRequest.organization.name,
					},
					ctx,
				);

				// Notify organization admins about new member
				notificationEventBus.emitNewMemberJoined(
					{
						userId: membershipRequest.userId,
						userName: membershipRequest.user.name,
						organizationId: membershipRequest.organizationId,
						organizationName: membershipRequest.organization.name,
					},
					ctx,
				);

				return {
					success: true,
					message:
						"Membership request accepted successfully. User added to organization.",
				};
			} catch (error) {
				ctx.log.error(error, "Error accepting membership request:");
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message:
							"Failed to accept membership request and add user to organization.",
					},
				});
			}
		},
		type: AcceptMembershipResponse,
	}),
);
