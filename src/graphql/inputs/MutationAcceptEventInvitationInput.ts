import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const acceptEventInvitationInputSchema = z.object({
	invitationToken: z.string().min(1),
});

export const AcceptEventInvitationInput = builder.inputType(
	"AcceptEventInvitationInput",
	{
		fields: (t) => ({
			invitationToken: t.string({
				description: "Invitation token from the invite link",
				required: true,
			}),
		}),
	},
);

export type AcceptEventInvitationInput = z.infer<
	typeof acceptEventInvitationInputSchema
>;
