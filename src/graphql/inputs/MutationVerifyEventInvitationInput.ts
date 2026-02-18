import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const verifyEventInvitationInputSchema = z.object({
	invitationToken: z.string().min(1),
});

export const VerifyEventInvitationInput = builder.inputType(
	"VerifyEventInvitationInput",
	{
		fields: (t) => ({
			invitationToken: t.string({ required: true }),
		}),
	},
);

export type VerifyEventInvitationInputShape = z.infer<
	typeof verifyEventInvitationInputSchema
>;

export default VerifyEventInvitationInput;
