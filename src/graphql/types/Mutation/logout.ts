import { builder } from "~/src/graphql/builder";
import envConfig from "~/src/utilities/graphqLimits";
import {
	hashRefreshToken,
	revokeAllUserRefreshTokens,
	revokeRefreshTokenByHash,
} from "~/src/utilities/refreshTokenUtils";

/**
 * Logout result type indicating whether logout was successful
 */
const LogoutResult = builder.objectRef<{ success: boolean }>("LogoutResult");

LogoutResult.implement({
	description: "Result of a logout operation",
	fields: (t) => ({
		success: t.exposeBoolean("success", {
			description: "Whether the logout was successful",
			nullable: false,
		}),
	}),
});

builder.mutationField("logout", (t) =>
	t.field({
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Mutation to log out the current user. Clears authentication cookies and revokes refresh tokens.",
		resolve: async (_parent, _args, ctx) => {
			// If user is authenticated, revoke all their refresh tokens for complete logout
			// This includes any token from cookies, so no need to revoke individually
			if (ctx.currentClient.isAuthenticated) {
				await revokeAllUserRefreshTokens(
					ctx.drizzleClient,
					ctx.currentClient.user.id,
				);
			} else if (ctx.cookie) {
				// User is not authenticated (e.g., expired access token)
				// but may have a valid refresh token in cookies - revoke it specifically
				const refreshTokenFromCookie = ctx.cookie.getRefreshToken();
				if (refreshTokenFromCookie) {
					const tokenHash = hashRefreshToken(refreshTokenFromCookie);
					await revokeRefreshTokenByHash(ctx.drizzleClient, tokenHash);
				}
			}

			// Clear HTTP-Only cookies if available (web clients)
			if (ctx.cookie) {
				ctx.cookie.clearAuthCookies();
			}

			return { success: true };
		},
		type: LogoutResult,
	}),
);
