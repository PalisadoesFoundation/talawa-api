import { builder } from "~/src/graphql/builder";

export type PasswordResetRequestPayload = {
	success: boolean;
	message: string;
};

export const PasswordResetRequestPayload = builder
	.objectRef<PasswordResetRequestPayload>("PasswordResetRequestPayload")
	.implement({
		description: "Payload returned from a password reset request.",
		fields: (t) => ({
			success: t.exposeBoolean("success", {
				description: "Whether the request was processed successfully.",
			}),
			message: t.exposeString("message", {
				description: "A message describing the result of the request.",
			}),
		}),
	});
