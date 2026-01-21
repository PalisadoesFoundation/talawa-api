import { builder } from "~/src/graphql/builder";
import { OAuthProvider } from "~/src/graphql/enums/OAuthProvider";

/**
 * Input for OAuth login and account linking operations.
 */
export const MutationOAuthLoginInput = builder.inputType("OAuthLoginInput", {
	description: "Input for OAuth login and account linking.",
	fields: (t) => ({
		provider: t.field({
			type: OAuthProvider,
			required: true,
			description: "The OAuth provider to authenticate with.",
		}),
		authorizationCode: t.string({
			required: true,
			description:
				"The authorization code received from the OAuth provider after user authorization.",
		}),
		redirectUri: t.string({
			required: true,
			description:
				"The redirect URI used in the OAuth flow. Must match the URI registered with the provider.",
		}),
	}),
});
