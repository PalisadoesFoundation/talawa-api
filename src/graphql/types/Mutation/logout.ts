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
		}),
	}),
});

builder.mutationField("logout", (t) =>
	t.field({
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Mutation to log out the current user. Clears authentication cookies and revokes refresh tokens.",
		resolve: async (_parent, _args, ctx) => {
			// Clear HTTP-Only cookies if available (web clients)
			if (ctx.cookie) {
				// Try to revoke the refresh token from cookies if present
				const refreshTokenFromCookie = ctx.cookie.getRefreshToken();
				if (refreshTokenFromCookie) {
					const tokenHash = hashRefreshToken(refreshTokenFromCookie);
					await revokeRefreshTokenByHash(ctx.drizzleClient, tokenHash);
				}

				// Clear the authentication cookies
				ctx.cookie.clearAuthCookies();
			}

			// If user is authenticated, revoke all their refresh tokens for complete logout
			if (ctx.currentClient.isAuthenticated) {
				await revokeAllUserRefreshTokens(
					ctx.drizzleClient,
					ctx.currentClient.user.id,
				);
			}

			return { success: true };
		},
		type: LogoutResult,
	}),
);
