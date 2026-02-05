import { and, eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { MutationOAuthLoginInput } from "~/src/graphql/inputs/MutationOAuthLoginInput";
import { InvalidAuthorizationCodeError } from "~/src/utilities/auth/oauth/errors";
import type { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import type {
	OAuthProviderTokenResponse,
	OAuthUserProfile,
} from "~/src/utilities/auth/oauth/types";
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
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Verify OAuth provider registry is available
			if (!ctx.oauthProviderRegistry) {
				ctx.log.error("OAuth provider registry is not available in context");
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "OAuth authentication is not available.",
				});
			}

			// Get the OAuth provider from the registry
			let provider: ReturnType<OAuthProviderRegistry["get"]>;
			try {
				provider = ctx.oauthProviderRegistry.get(
					args.input.provider.toLowerCase(),
				);
			} catch (_error) {
				ctx.log.warn(
					{ provider: args.input.provider.toLowerCase() },
					"OAuth provider not found or not enabled",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "provider"],
								message: `OAuth provider "${args.input.provider.toLowerCase()}" is not enabled or not found.`,
							},
						],
					},
				});
			}

			// Exchange authorization code for access token
			let tokenResponse: OAuthProviderTokenResponse;
			try {
				tokenResponse = await provider.exchangeCodeForTokens(
					args.input.authorizationCode,
					args.input.redirectUri,
				);
			} catch (error) {
				ctx.log.error(
					{ error, provider: args.input.provider.toLowerCase() },
					"Failed to exchange authorization code for tokens",
				);
				// Distinguish invalid/expired authorization code from other failures
				if (error instanceof InvalidAuthorizationCodeError) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "authorizationCode"],
									message:
										"Invalid or expired authorization code. Please try linking again.",
								},
							],
						},
					});
				}
				// For provider/network or other unexpected failures, avoid blaming user input
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message:
						"Failed to link OAuth account due to a temporary problem. Please try again.",
				});
			}

			// Fetch user profile from OAuth provider
			let userProfile: OAuthUserProfile;
			try {
				userProfile = await provider.getUserProfile(tokenResponse.access_token);
			} catch (error) {
				ctx.log.error(
					{ error, provider: args.input.provider.toLowerCase() },
					"Failed to fetch user profile from OAuth provider",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message:
						"Failed to retrieve user information from OAuth provider. Please try again.",
				});
			}

			// Validate that we got essential user information
			if (!userProfile.providerId) {
				ctx.log.error(
					{ provider: args.input.provider.toLowerCase() },
					"OAuth provider did not return a provider ID",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message:
						"Invalid user profile received from OAuth provider. Please try again.",
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Use transaction for atomicity: check existing accounts and link OAuth account
			return await ctx.drizzleClient.transaction(async (tx) => {
				// Get the current authenticated user
				const [currentUser] = await tx
					.select()
					.from(usersTable)
					.where(eq(usersTable.id, currentUserId));

				if (!currentUser) {
					ctx.log.error(
						{ userId: currentUserId },
						"Authenticated user not found in database",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "User account not found. Please sign in again.",
					});
				}

				// Check if this OAuth account is already linked to any user
				const [existingOAuthAccount] = await tx
					.select()
					.from(oauthAccountsTable)
					.where(
						and(
							eq(
								oauthAccountsTable.provider,
								args.input.provider.toLowerCase(),
							),
							eq(oauthAccountsTable.providerId, userProfile.providerId),
						),
					);

				if (existingOAuthAccount) {
					if (existingOAuthAccount.userId === currentUser.id) {
						// Account is already linked to the current user
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["input", "provider"],
										message: `Your ${args.input.provider} account is already linked to this user account.`,
									},
								],
							},
						});
					} else {
						// Account is linked to a different user
						throw new TalawaGraphQLError({
							extensions: {
								code: "forbidden_action",
							},
							message: `This ${args.input.provider} account is already linked to another user. Please use a different ${args.input.provider} account or unlink it from the other user first.`,
						});
					}
				}

				// Check email verification if OAuth provider returns email
				if (
					userProfile.email &&
					userProfile.email !== currentUser.emailAddress
				) {
					// Different email from current user - require email verification for security
					if (!userProfile.emailVerified) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "forbidden_action",
							},
							message:
								"The email address from your OAuth provider is different from your current account and is not verified. Please verify your email with the OAuth provider first.",
						});
					}
				}

				// Create the OAuth account link
				await tx.insert(oauthAccountsTable).values({
					id: uuidv7(),
					userId: currentUser.id,
					provider: args.input.provider.toLowerCase(),
					providerId: userProfile.providerId,
					email: userProfile.email,
					profile: {
						name: userProfile.name,
						picture: userProfile.picture,
						emailVerified: userProfile.emailVerified,
					},
					linkedAt: new Date(),
					lastUsedAt: new Date(),
				});
				ctx.log.info(
					{
						userId: currentUser.id,
						provider: args.input.provider.toLowerCase(),
						providerId: userProfile.providerId,
					},
					"OAuth account successfully linked to user",
				);

				return currentUser;
			});
		},
	}),
);
