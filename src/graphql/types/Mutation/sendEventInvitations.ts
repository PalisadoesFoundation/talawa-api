import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventInvitationsTable } from "~/src/drizzle/tables/eventInvitations";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	SendEventInvitationsInput,
	sendEventInvitationsInputSchema,
} from "~/src/graphql/inputs/MutationSendEventInvitationsInput";
import { EventInvitation } from "~/src/graphql/types/EventInvitation/EventInvitation";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationSendEventInvitationsArgumentsSchema = z.object({
	input: sendEventInvitationsInputSchema,
});

builder.mutationField("sendEventInvitations", (t) =>
	t.field({
		args: {
			input: t.arg({ required: true, type: SendEventInvitationsInput }),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Send email invitations to one or more addresses for an event.",
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
			} = mutationSendEventInvitationsArgumentsSchema.safeParse(args);

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

			let organizationId: string;
			const eventId = parsedArgs.input.eventId ?? null;
			const recurringInstanceId =
				parsedArgs.input.recurringEventInstanceId ?? null;

			if (eventId) {
				const ev = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, eventId),
				});

				if (!ev) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "eventId"] }],
						},
					});
				}

				organizationId = ev.organizationId;
			} else if (recurringInstanceId) {
				const inst =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(recurringEventInstancesTable.id, recurringInstanceId),
					});

				if (!inst) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "recurringEventInstanceId"] }],
						},
					});
				}

				organizationId = inst.organizationId;
			} else {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input"],
								message:
									"Either eventId or recurringEventInstanceId must be provided",
							},
						],
					},
				});
			}
			const currentUserMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: and(
						eq(organizationMembershipsTable.memberId, currentUserId),
						eq(organizationMembershipsTable.organizationId, organizationId),
					),
				});

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, currentUserId),
			});

			if (
				currentUser?.role !== "administrator" &&
				currentUserMembership?.role !== "administrator"
			) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				});
			}

			const now = new Date();
			const expiresInDays = parsedArgs.input.expiresInDays ?? 7;
			const expiresAt = new Date(now);
			expiresAt.setDate(expiresAt.getDate() + expiresInDays);

			const invitationsToInsert = parsedArgs.input.emails.map((email) => {
				const token = crypto.randomBytes(32).toString("hex");
				return {
					eventId: eventId,
					recurringEventInstanceId: recurringInstanceId,
					invitedBy: currentUserId,
					inviteeEmail: email,
					invitationToken: token,
					status: "pending",
					expiresAt,
					metadata: { message: parsedArgs.input.message || null },
				};
			});

			const createdInvitations = await ctx.drizzleClient.transaction(
				async (tx) => {
					const created = await tx
						.insert(eventInvitationsTable)
						.values(invitationsToInsert)
						.returning();

					for (const inv of created) {
						const url = `${ctx.envConfig.FRONTEND_URL}/event/invitation/${inv.invitationToken}`;

						try {
							ctx.notification?.enqueueSendEventInvite({
								inviteeEmail: inv.inviteeEmail,
								inviteeName: inv.inviteeName ?? undefined,
								eventId: inv.eventId ?? undefined,
								eventName: eventId ? "Event" : undefined,
								organizationId,
								inviterId: currentUserId,
								invitationToken: inv.invitationToken,
								invitationUrl: url,
							});
						} catch (err) {
							ctx.log.error(
								{ err, inviteId: inv.id },
								"Failed to enqueue invitation email",
							);
						}
					}

					return created;
				},
			);

			try {
				await ctx.notification?.flush(ctx);
			} catch (error) {
				ctx.log.error(
					{ error },
					"Failed to flush event invitation notifications",
				);
			}

			return createdInvitations;
		},
		type: [EventInvitation],
	}),
);
