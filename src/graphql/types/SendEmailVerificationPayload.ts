import { builder } from "~/src/graphql/builder";

export type SendEmailVerificationPayload = {
	success: boolean;
	message: string;
};

export const SendEmailVerificationPayload = builder
	.objectRef<SendEmailVerificationPayload>("SendEmailVerificationPayload")
	.implement({
		description:
			"Response payload for sendVerificationEmail mutation. Returns same response whether email was sent or not to prevent email enumeration.",
		fields: (t) => ({
			success: t.exposeBoolean("success", {
				description: "Indicates if the request was processed successfully.",
			}),
			message: t.exposeString("message", {
				description: "User-friendly message about the request.",
			}),
		}),
	});
