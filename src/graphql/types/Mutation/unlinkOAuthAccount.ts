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
				});
			}

			const userId = ctx.currentClient.user.id;

			// 1. Check if the specific OAuth account exists
			const existingAccount =
				await ctx.drizzleClient.query.oauthAccountsTable.findFirst({
					where: (accounts, { eq, and }) =>
						and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
				});

			if (!existingAccount) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.NOT_FOUND,
					},
					message: `No linked account found for provider ${provider}`,
				});
			}

			// 2. Count total linked OAuth accounts for this user
			const userOAuthAccounts = await ctx.drizzleClient
				.select()
				.from(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, userId));

			const oauthCount = userOAuthAccounts.length;

			// 3. Check if user has a password (assuming non-empty passwordHash means valid password)
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
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

			// 4. Validate safety constraint
			const hasPassword = !!user.passwordHash;
			const remainingOAuth = oauthCount - 1;

			if (!hasPassword && remainingOAuth < 1) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.FORBIDDEN_ACTION,
					},
					message:
						"Cannot unlink the last authentication method. Please set a password or link another provider first.",
				});
			}

			// 5. Perform Unlink
			await ctx.drizzleClient
				.delete(oauthAccountsTable)
				.where(
					and(
						eq(oauthAccountsTable.userId, userId),
						eq(oauthAccountsTable.provider, provider),
					),
				);

			// 6. Return the up-to-date user object
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
