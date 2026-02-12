import { eq } from "drizzle-orm";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { OAuthAccountInfo } from "~/src/graphql/types/OAuthAccountInfo/OAuthAccountInfo";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "./User";

User.implement({
	fields: (t) => ({
		oauthAccounts: t.field({
			type: [OAuthAccountInfo],
			nullable: false,
			description:
				"Linked OAuth accounts for this user. Only visible to the authenticated user.",
			complexity: envConfig.API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Only allow users to see their own OAuth accounts
				if (parent.id !== ctx.currentClient.user.id) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
						message: "You can only view your own OAuth accounts.",
					});
				}

				// Query OAuth accounts for the current user
				const oauthAccounts = await ctx.drizzleClient
					.select({
						provider: oauthAccountsTable.provider,
						email: oauthAccountsTable.email,
						linkedAt: oauthAccountsTable.linkedAt,
						lastUsedAt: oauthAccountsTable.lastUsedAt,
					})
					.from(oauthAccountsTable)
					.where(eq(oauthAccountsTable.userId, parent.id));

				// Transform database results to match OAuthAccountInfo type
				return oauthAccounts.map((account) => ({
					provider: account.provider.toUpperCase() as "GOOGLE" | "GITHUB",
					email: account.email || "",
					linkedAt: account.linkedAt,
					lastUsedAt: account.lastUsedAt,
				}));
			},
		}),
	}),
});
