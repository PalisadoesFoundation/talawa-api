import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { email, eventId } from "~/src/graphql/validators/core";

// Backwards-compatible input: accept either `emails: [String]` (existing) or
// `recipients: [{ email, name? }]` (new). At least one recipient/email must be
// provided.
export const recipientSchema = z.object({
	email,
	name: z.string().optional(),
});

export const sendEventInvitationsInputSchema = z
	.object({
		eventId: eventId.nullable().optional(),
		recurringEventInstanceId: eventId.nullable().optional(),
		// legacy array of email strings
		emails: z.array(email).optional(),
		// new recipients array with optional name
		recipients: z.array(recipientSchema).optional(),
		message: z.string().optional(),
		expiresInDays: z.number().int().positive().optional(),
	})
	.refine(
		(v) =>
			(v.recipients && v.recipients.length > 0) ||
			(v.emails && v.emails.length > 0),
		{
			message: "Either 'emails' or 'recipients' must be provided",
		},
	);

export type SendEventInvitationsInput = z.infer<
	typeof sendEventInvitationsInputSchema
>;

export const RecipientInput = builder.inputType("RecipientInput", {
	fields: (t) => ({
		email: t.string({ required: true }),
		name: t.string({ required: false }),
	}),
});

export const SendEventInvitationsInput = builder.inputType(
	"SendEventInvitationsInput",
	{
		fields: (t) => ({
			eventId: t.field({ type: "ID", required: false }),
			recurringEventInstanceId: t.field({ type: "ID", required: false }),
			// keep legacy field for backwards compatibility
			emails: t.field({ type: ["String"], required: false }),
			// new recipients field
			recipients: t.field({ type: [RecipientInput], required: false }),
			message: t.string({ required: false }),
			expiresInDays: t.int({ required: false }),
		}),
	},
);
