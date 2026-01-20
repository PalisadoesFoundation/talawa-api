import { builder } from "~/src/graphql/builder";
import { MutationOAuthLoginInput } from "~/src/graphql/inputs/MutationOAuthLoginInput";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "../User/User";

/**
 * Link an OAuth provider to the current authenticated user.
 */
builder.mutationField("linkOAuthAccount", (t) =>
	t.field({
		type: User,
		description: "Link an OAuth provider to the current authenticated user.",
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
				message: "linkOAuthAccount mutation is not yet implemented.",
			});
		},
	}),
);
