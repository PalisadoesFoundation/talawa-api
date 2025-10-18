import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const sendEventInvitationsInputSchema = z.object({
	eventId: z.string().uuid().optional(),
	recurringEventInstanceId: z.string().uuid().optional(),
	emails: z.array(z.string().email()).min(1),
	message: z.string().optional(),
	expiresInDays: z.number().int().positive().optional(),
});

export type SendEventInvitationsInput = z.infer<
	typeof sendEventInvitationsInputSchema
>;

export const SendEventInvitationsInput = builder.inputType(
	"SendEventInvitationsInput",
	{
		fields: (t) => ({
			eventId: t.field({ type: "ID", required: false }),
			recurringEventInstanceId: t.field({ type: "ID", required: false }),
			emails: t.field({ type: ["String"], required: true }),
			message: t.string({ required: false }),
			expiresInDays: t.int({ required: false }),
		}),
	},
);
