import { builder } from "~/src/graphql/builder";
import { User } from "./User/User";
import type { User as UserType } from "./User/User";

export type AuthenticationPayload = {
	authenticationToken: string;
	user: UserType;
};

export const AuthenticationPayload = builder
	.objectRef<AuthenticationPayload>("AuthenticationPayload")
	.implement({
		description: "",
		fields: (t) => ({
			authenticationToken: t.exposeString("authenticationToken", {
				description:
					"This is the authentication token using which a user can sign in to talawa.",
			}),
			user: t.expose("user", {
				description: "",
				type: User,
			}),
		}),
	});
