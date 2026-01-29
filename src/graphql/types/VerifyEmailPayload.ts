import { builder } from "~/src/graphql/builder";

export type VerifyEmailPayload = {
	success: boolean;
	message: string;
};

export const VerifyEmailPayload = builder
	.objectRef<VerifyEmailPayload>("VerifyEmailPayload")
	.implement({
		description: "Response payload for verifyEmail mutation.",
		fields: (t) => ({
			success: t.exposeBoolean("success", {
				description:
					"Indicates if the email was successfully verified. Returns true even if already verified (idempotent).",
			}),
			message: t.exposeString("message", {
				description: "User-friendly message about the verification result.",
			}),
		}),
	});
