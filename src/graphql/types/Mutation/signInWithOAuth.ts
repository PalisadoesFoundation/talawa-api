import { builder } from "~/src/graphql/builder";
import { MutationOAuthLoginInput } from "~/src/graphql/inputs/MutationOAuthLoginInput";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AuthenticationPayload } from "../AuthenticationPayload";

/**
 * Sign in or sign up using an OAuth provider.
 * Exchanges an authorization code for tokens, creates/links user, and returns AuthenticationPayload.
 */
builder.mutationField("signInWithOAuth", (t) =>
	t.field({
		type: AuthenticationPayload,
		description:
			"Sign in or sign up using an OAuth provider. Exchanges an authorization code for tokens, creates/links user, and returns AuthenticationPayload.",
		args: {
			input: t.arg({
				type: MutationOAuthLoginInput,
				required: true,
				description:
					"Input containing OAuth provider details and authorization code.",
			}),
		},
		resolve: () => {
			// Placeholder resolver - Phase 3 will implement actual resolver
			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
				message: "signInWithOAuth mutation is not yet implemented.",
			});
		},
	}),
);
