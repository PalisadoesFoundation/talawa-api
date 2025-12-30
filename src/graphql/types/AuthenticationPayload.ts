import { builder } from "~/src/graphql/builder";
import type { User as UserType } from "./User/User";
import { User } from "./User/User";

export type AuthenticationPayload = {
	authenticationToken: string;
	refreshToken: string;
	user: UserType;
};

export const AuthenticationPayload = builder
	.objectRef<AuthenticationPayload>("AuthenticationPayload")
	.implement({
		description: "",
		fields: (t) => ({
			authenticationToken: t.exposeString("authenticationToken", {
				description:
					"This is the short-lived access token using which a user can authenticate API requests.",
			}),
			refreshToken: t.exposeString("refreshToken", {
				description:
					"This is the long-lived refresh token used to obtain new access tokens without re-authentication.",
			}),
			user: t.expose("user", {
				description: "",
				type: User,
			}),
		}),
	});
