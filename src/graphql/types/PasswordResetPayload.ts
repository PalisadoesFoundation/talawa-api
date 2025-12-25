import { builder } from "~/src/graphql/builder";

export type PasswordResetPayload = {
	success: boolean;
	authenticationToken: string | null;
	refreshToken: string | null;
};

export const PasswordResetPayload = builder
	.objectRef<PasswordResetPayload>("PasswordResetPayload")
	.implement({
		description: "Payload returned after successfully resetting a password.",
		fields: (t) => ({
			success: t.exposeBoolean("success", {
				description: "Whether the password was successfully reset.",
			}),
			authenticationToken: t.exposeString("authenticationToken", {
				description:
					"The new authentication token for auto-login after password reset.",
				nullable: true,
			}),
			refreshToken: t.exposeString("refreshToken", {
				description:
					"The new refresh token for auto-login after password reset.",
				nullable: true,
			}),
		}),
	});
