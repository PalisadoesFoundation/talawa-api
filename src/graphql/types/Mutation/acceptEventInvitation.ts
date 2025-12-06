import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventInvitationsTable } from "~/src/drizzle/tables/eventInvitations";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	AcceptEventInvitationInput,
	acceptEventInvitationInputSchema,
} from "~/src/graphql/inputs/MutationAcceptEventInvitationInput";
import { EventInvitation } from "~/src/graphql/types/EventInvitation/EventInvitation";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationAcceptEventInvitationArgs = z.object({
	input: acceptEventInvitationInputSchema,
});

builder.mutationField("acceptEventInvitation", (t) =>
	t.field({
		args: {
			input: t.arg({ required: true, type: AcceptEventInvitationInput }),
		},
		type: EventInvitation,
		description:
			"Accept an event invitation. Links the current user to the invitation, joins the organization if needed and registers the user as an attendee. This is performed atomically.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const { success, error } =
				mutationAcceptEventInvitationArgs.safeParse(args);
			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((i) => ({
							argumentPath: i.path,
							message: i.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const invitation =
				await ctx.drizzleClient.query.eventInvitationsTable.findFirst({
					where: eq(
						eventInvitationsTable.invitationToken,
						args.input.invitationToken,
					),
				});

			if (!invitation) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "invitationToken"] }],
					},
				});
			}

			if (invitation.status !== "pending") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "invitationToken"],
								message: "Invitation is not pending",
							},
						],
					},
				});
			}

			const now = new Date();
			if (invitation.expiresAt && invitation.expiresAt < now) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "invitationToken"],
								message: "Invitation has expired",
							},
						],
					},
				});
			}

			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, currentUserId),
			});
			if (!user) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (
				user.emailAddress.toLowerCase() !==
				invitation.inviteeEmail.toLowerCase()
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
						message: "Authenticated user email does not match invitation email",
					},
				});
			}

			const updatedInv = await ctx.drizzleClient.transaction(async (tx) => {
				const updated = await tx
					.update(eventInvitationsTable)
					.set({ userId: currentUserId, status: "accepted", respondedAt: now })
					.where(eq(eventInvitationsTable.id, invitation.id))
					.returning();

				let organizationId: string | null = null;
				if (invitation.eventId) {
					const ev = await tx.query.eventsTable.findFirst({
						where: eq(eventsTable.id, invitation.eventId),
					});
					organizationId = ev?.organizationId ?? null;
				} else if (invitation.recurringEventInstanceId) {
					const inst = await tx.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							invitation.recurringEventInstanceId,
						),
					});
					organizationId = inst?.organizationId ?? null;
				}

				if (organizationId) {
					const existingMembership =
						await tx.query.organizationMembershipsTable.findFirst({
							where: and(
								eq(organizationMembershipsTable.memberId, currentUserId),
								eq(organizationMembershipsTable.organizationId, organizationId),
							),
						});

					if (!existingMembership) {
						await tx.insert(organizationMembershipsTable).values({
							memberId: currentUserId,
							organizationId,
							creatorId: currentUserId,
							role: "regular",
						});
					}
				}

				if (invitation.eventId) {
					const existing = await tx.query.eventAttendeesTable.findFirst({
						where: and(
							eq(eventAttendeesTable.userId, currentUserId),
							eq(eventAttendeesTable.eventId, invitation.eventId),
						),
					});

					if (!existing) {
						await tx.insert(eventAttendeesTable).values({
							userId: currentUserId,
							eventId: invitation.eventId,
							isInvited: true,
							isRegistered: true,
						});
					} else {
						await tx
							.update(eventAttendeesTable)
							.set({ isInvited: true, isRegistered: true })
							.where(eq(eventAttendeesTable.id, existing.id));
					}
				} else if (invitation.recurringEventInstanceId) {
					const existing = await tx.query.eventAttendeesTable.findFirst({
						where: and(
							eq(eventAttendeesTable.userId, currentUserId),
							eq(
								eventAttendeesTable.recurringEventInstanceId,
								invitation.recurringEventInstanceId,
							),
						),
					});

					if (!existing) {
						await tx.insert(eventAttendeesTable).values({
							userId: currentUserId,
							recurringEventInstanceId: invitation.recurringEventInstanceId,
							isInvited: true,
							isRegistered: true,
						});
					} else {
						await tx
							.update(eventAttendeesTable)
							.set({ isInvited: true, isRegistered: true })
							.where(eq(eventAttendeesTable.id, existing.id));
					}
				} else {
					const existing = await tx.query.eventAttendeesTable.findFirst({
						where: eq(eventAttendeesTable.userId, currentUserId),
					});

					if (!existing) {
						await tx.insert(eventAttendeesTable).values({
							userId: currentUserId,
							isInvited: true,
							isRegistered: true,
						});
					} else {
						await tx
							.update(eventAttendeesTable)
							.set({ isInvited: true, isRegistered: true })
							.where(eq(eventAttendeesTable.id, existing.id));
					}
				}

				return updated[0];
			});

			return updatedInv;
		},
	}),
);
