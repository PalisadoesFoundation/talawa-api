import { builder } from "~/src/graphql/builder";
import { OAuthProvider } from "~/src/graphql/enums/OAuthProvider";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "../User/User";

/**
 * Unlink an OAuth provider from the current authenticated user.
 */
builder.mutationField("unlinkOAuthAccount", (t) =>
	t.field({
		type: User,
		description:
			"Unlink an OAuth provider from the current authenticated user.",
		args: {
			provider: t.arg({
				type: OAuthProvider,
				required: true,
				description: "The OAuth provider to unlink from the user account.",
			}),
		},
		resolve: () => {
			// Placeholder resolver - Phase 3 will implement actual resolver
			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
				message: "unlinkOAuthAccount mutation is not yet implemented.",
			});
		},
	}),
);
