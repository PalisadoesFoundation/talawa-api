import { builder } from "~/src/graphql/builder";

export type PasswordResetTokenVerification = {
	valid: boolean;
	expiresAt: Date | null;
};

export const PasswordResetTokenVerification = builder
	.objectRef<PasswordResetTokenVerification>("PasswordResetTokenVerification")
	.implement({
		description: "Payload returned from verifying a password reset token.",
		fields: (t) => ({
			valid: t.exposeBoolean("valid", {
				description:
					"Whether the token is valid and can be used for password reset.",
			}),
			expiresAt: t.expose("expiresAt", {
				description:
					"The expiration time of the token (null if token is invalid).",
				type: "DateTime",
				nullable: true,
			}),
		}),
	});
