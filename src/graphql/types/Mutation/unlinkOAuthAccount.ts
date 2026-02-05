import { and, eq } from "drizzle-orm";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { builder } from "~/src/graphql/builder";
import { OAuthProvider } from "~/src/graphql/enums/OAuthProvider";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
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
		resolve: async (_parent, { provider }, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.UNAUTHENTICATED,
					},
					message: "You must be authenticated to perform this action.",
				});
			}

			const userId = ctx.currentClient.user.id;

			// 1. Check if the specific OAuth account exists
			const existingAccount =
				await ctx.drizzleClient.query.oauthAccountsTable.findFirst({
					where: (accounts, { eq, and }) =>
						and(
							eq(accounts.userId, userId),
							eq(accounts.provider, provider.toLowerCase()),
						),
				});

			if (!existingAccount) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.NOT_FOUND,
					},
					message: `No linked account found for provider ${provider}`,
				});
			}

			// 2. Perform atomic count-check-delete transaction
			await ctx.drizzleClient.transaction(async (tx) => {
				// Check if user has a password (MOVED inside transaction for safety)
				const user = await tx.query.usersTable.findFirst({
					where: (users, { eq }) => eq(users.id, userId),
					columns: {
						id: true,
						passwordHash: true,
					},
				});

				if (!user) {
					throw new TalawaGraphQLError({
						extensions: { code: ErrorCode.NOT_FOUND },
						message: "User not found",
					});
				}

				const hasPassword = !!user.passwordHash;
				// Count total linked OAuth accounts for this user (within transaction)
				const userOAuthAccounts = await tx
					.select()
					.from(oauthAccountsTable)
					.where(eq(oauthAccountsTable.userId, userId));

				const oauthCount = userOAuthAccounts.length;
				const remainingOAuth = oauthCount - 1;

				// Validate safety constraint
				if (!hasPassword && remainingOAuth < 1) {
					throw new TalawaGraphQLError({
						extensions: {
							code: ErrorCode.FORBIDDEN_ACTION,
						},
						message:
							"Cannot unlink the last authentication method. Please set a password or link another provider first.",
					});
				}

				// Perform Unlink
				await tx
					.delete(oauthAccountsTable)
					.where(
						and(
							eq(oauthAccountsTable.userId, userId),
							eq(oauthAccountsTable.provider, provider.toLowerCase()),
						),
					);
			});

			// 3. Return the up-to-date user object
			const updatedUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (users, { eq }) => eq(users.id, userId),
			});

			if (!updatedUser) {
				throw new TalawaGraphQLError({
					extensions: { code: ErrorCode.UNEXPECTED },
				});
			}

			return updatedUser;
		},
	}),
);
