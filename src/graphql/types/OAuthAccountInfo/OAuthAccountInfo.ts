import { builder } from "~/src/graphql/builder";
import { OAuthProvider } from "~/src/graphql/enums/OAuthProvider";

/**
 * Type representing a linked OAuth account.
 */
export type OAuthAccountInfo = {
	provider: "GOOGLE" | "GITHUB";
	email: string;
	linkedAt: Date;
	lastUsedAt: Date;
};

export const OAuthAccountInfo = builder
	.objectRef<OAuthAccountInfo>("OAuthAccountInfo")
	.implement({
		description: "Linked OAuth account info for a user.",
		fields: (t) => ({
			provider: t.expose("provider", {
				type: OAuthProvider,
				description: "The OAuth provider.",
			}),
			email: t.exposeString("email", {
				description: "Email address associated with the OAuth account.",
			}),
			linkedAt: t.expose("linkedAt", {
				type: "DateTime",
				description: "Date and time when the OAuth account was linked.",
			}),
			lastUsedAt: t.expose("lastUsedAt", {
				type: "DateTime",
				description:
					"Date and time when the OAuth account was last used for authentication.",
			}),
		}),
	});
