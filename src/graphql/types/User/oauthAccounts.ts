import { OAuthAccountInfo } from "~/src/graphql/types/OAuthAccountInfo/OAuthAccountInfo";
import { User } from "./User";

User.implement({
	fields: (t) => ({
		oauthAccounts: t.field({
			type: [OAuthAccountInfo],
			nullable: false,
			description:
				"Linked OAuth accounts for this user. Only visible to the authenticated user.",
			resolve: () => {
				// Placeholder resolver - Phase 3 will implement actual resolver
				// Returns empty array for now
				return [];
			},
		}),
	}),
});
