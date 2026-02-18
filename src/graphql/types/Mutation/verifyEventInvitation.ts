import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventInvitationsTable } from "~/src/drizzle/tables/eventInvitations";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	VerifyEventInvitationInput,
	verifyEventInvitationInputSchema,
} from "~/src/graphql/inputs/MutationVerifyEventInvitationInput";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

export const VerifyEventInvitationPreview = builder.objectRef<{
	invitationToken: string;
	inviteeEmailMasked: string;
	inviteeName: string | null;
	status: string;
	expiresAt: string | null;
	eventId: string | null;
	recurringEventInstanceId: string | null;
	organizationId: string | null;
}>("VerifyEventInvitationPreview");

VerifyEventInvitationPreview.implement({
	fields: (t) => ({
		invitationToken: t.exposeString("invitationToken"),
		inviteeEmailMasked: t.exposeString("inviteeEmailMasked"),
		inviteeName: t.exposeString("inviteeName", { nullable: true }),
		status: t.exposeString("status"),
		expiresAt: t.exposeString("expiresAt", { nullable: true }),
		eventId: t.exposeString("eventId", { nullable: true }),
		recurringEventInstanceId: t.exposeString("recurringEventInstanceId", {
			nullable: true,
		}),
		organizationId: t.exposeString("organizationId", { nullable: true }),
	}),
});

function maskEmail(email: string) {
	try {
		const [local, domain] = email.split("@");
		if (!local || !domain) return "****@***";
		if (local.length <= 2) return `${local[0]}***@${domain}`;
		const visible = local[0];
		const last = local[local.length - 1];
		return `${visible}***${last}@${domain}`;
	} catch (_err) {
		return "****@***";
	}
}

const mutationVerifyEventInvitationArgs = z.object({
	input: verifyEventInvitationInputSchema,
});

builder.mutationField("verifyEventInvitation", (t) =>
	t.field({
		args: {
			input: t.arg({ required: true, type: VerifyEventInvitationInput }),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Public preview of an event invitation. Returns masked email and minimal event/org info. Rate-limited.",
		type: VerifyEventInvitationPreview,
		resolve: async (_parent, args, ctx) => {
			const { success, error } =
				mutationVerifyEventInvitationArgs.safeParse(args);
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

			const token = args.input.invitationToken;

			const invitation =
				await ctx.drizzleClient.query.eventInvitationsTable.findFirst({
					where: eq(eventInvitationsTable.invitationToken, token),
				});

			if (!invitation) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "invitationToken"] }],
					},
				});
			}
			let organizationId: string | null = null;
			if (invitation.eventId) {
				const ev = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, invitation.eventId),
				});
				organizationId = ev?.organizationId ?? null;
			} else if (invitation.recurringEventInstanceId) {
				const inst =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							invitation.recurringEventInstanceId,
						),
					});
				organizationId = inst?.organizationId ?? null;
			}

			return {
				invitationToken: invitation.invitationToken,
				inviteeEmailMasked: maskEmail(invitation.inviteeEmail),
				inviteeName: invitation.inviteeName ?? null,
				status: invitation.status,
				expiresAt: invitation.expiresAt
					? invitation.expiresAt.toISOString()
					: null,
				eventId: invitation.eventId ?? null,
				recurringEventInstanceId: invitation.recurringEventInstanceId ?? null,
				organizationId,
			};
		},
	}),
);

export default {};
