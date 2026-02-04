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
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	generateRefreshToken,
	hashRefreshToken,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { CurrentClient } from "../../context";
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
		resolve: async (_parent, args, ctx) => {
			// Prevent already authenticated users from signing in again
			if (ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
					},
					message: "You are already signed in. Please sign out first.",
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
										"Invalid or expired authorization code. Please try signing in again.",
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
						"Failed to sign in with OAuth due to a temporary problem. Please try again.",
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

			// Use transaction for atomicity: find/create user and link OAuth account
			return await ctx.drizzleClient.transaction(async (tx) => {
				// Try to find existing OAuth account
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

				let user: typeof usersTable.$inferSelect;

				if (existingOAuthAccount) {
					// Path 1: OAuth account already linked - fetch the user
					const [existingUser] = await tx
						.select()
						.from(usersTable)
						.where(eq(usersTable.id, existingOAuthAccount.userId));

					if (!existingUser) {
						ctx.log.error(
							{ userId: existingOAuthAccount.userId },
							"OAuth account linked to non-existent user",
						);
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
							message: "User account not found. Please contact support.",
						});
					}

					user = existingUser;

					// Update lastUsedAt for the OAuth account
					await tx
						.update(oauthAccountsTable)
						.set({ lastUsedAt: new Date() })
						.where(eq(oauthAccountsTable.id, existingOAuthAccount.id));
				} else {
					// No existing OAuth account - check if user exists by email
					let userByEmail: typeof usersTable.$inferSelect | undefined;
					if (userProfile.email) {
						[userByEmail] = await tx
							.select()
							.from(usersTable)
							.where(eq(usersTable.emailAddress, userProfile.email));
					}

					if (userByEmail) {
						// Path 2: User exists with matching email - link OAuth account
						// SECURITY: Only link by email if the OAuth provider has verified the email
						// to prevent account takeover attacks
						if (!userProfile.emailVerified) {
							throw new TalawaGraphQLError({
								extensions: {
									code: "forbidden_action",
								},
								message:
									"A user with this email already exists. Please verify your email with the OAuth provider or sign in directly to link your account.",
							});
						}

						user = userByEmail;

						await tx.insert(oauthAccountsTable).values({
							id: uuidv7(),
							userId: user.id,
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

						// If OAuth email is verified, mark user email as verified
						if (userProfile.emailVerified && !user.isEmailAddressVerified) {
							await tx
								.update(usersTable)
								.set({ isEmailAddressVerified: true })
								.where(eq(usersTable.id, user.id));

							// Update local user object to reflect change
							user.isEmailAddressVerified = true;
						}
					} else {
						// Path 3: New user - create user and link OAuth account
						if (!userProfile.email) {
							// We need an email to create a user
							throw new TalawaGraphQLError({
								extensions: {
									code: "forbidden_action",
								},
								message:
									"Your OAuth provider did not share your email address. Please grant email access or use a different sign-in method.",
							});
						}

						if (!userProfile.name) {
							// We need a name to create a user
							throw new TalawaGraphQLError({
								extensions: {
									code: "forbidden_action",
								},
								message:
									"Your OAuth provider did not share your name. Please update your profile on the provider or use a different sign-in method.",
							});
						}

						const userId = uuidv7();

						// Create the new user
						const [createdUser] = await tx
							.insert(usersTable)
							.values({
								id: userId,
								creatorId: userId,
								emailAddress: userProfile.email,
								name: userProfile.name,
								isEmailAddressVerified: userProfile.emailVerified ?? false,
								role: "regular",
								// Set a secure random password hash - user won't use it for OAuth login
								// but it's required by the schema
								passwordHash: `oauth_${uuidv7()}`,
							})
							.returning();

						if (!createdUser) {
							ctx.log.error(
								"Postgres insert operation unexpectedly returned an empty array",
							);
							throw new TalawaGraphQLError({
								extensions: {
									code: "unexpected",
								},
							});
						}

						user = createdUser;

						// Link the OAuth account
						await tx.insert(oauthAccountsTable).values({
							id: uuidv7(),
							userId: user.id,
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
					}
				}

				// Reset failed login attempts on successful OAuth authentication
				// This ensures consistency with password-based login flow
				if (
					user.failedLoginAttempts > 0 ||
					user.lockedUntil ||
					user.lastFailedLoginAt
				) {
					await tx
						.update(usersTable)
						.set({
							failedLoginAttempts: 0,
							lockedUntil: null,
							lastFailedLoginAt: null,
						})
						.where(eq(usersTable.id, user.id));

					// Update local user object to reflect changes
					user.failedLoginAttempts = 0;
					user.lockedUntil = null;
					user.lastFailedLoginAt = null;
				}

				// Update authentication context
				ctx.currentClient.isAuthenticated = true;
				ctx.currentClient.user = {
					id: user.id,
				} as CurrentClient["user"];

				// Generate refresh token
				const rawRefreshToken = generateRefreshToken();
				const refreshTokenHash = hashRefreshToken(rawRefreshToken);

				// Calculate refresh token expiry (default 7 days if not configured)
				const refreshTokenExpiresIn =
					ctx.envConfig.API_REFRESH_TOKEN_EXPIRES_IN ??
					DEFAULT_REFRESH_TOKEN_EXPIRES_MS;
				const refreshTokenExpiresAt = new Date(
					Date.now() + refreshTokenExpiresIn,
				);

				// Store refresh token in database
				await storeRefreshToken(
					tx,
					user.id,
					refreshTokenHash,
					refreshTokenExpiresAt,
				);

				// Generate JWT access token
				const accessToken = ctx.jwt.sign({
					user: {
						id: user.id,
					},
				});

				// Set HTTP-Only cookies for web clients if cookie helper is available
				if (ctx.cookie) {
					ctx.cookie.setAuthCookies(accessToken, rawRefreshToken);
				}

				return {
					authenticationToken: accessToken,
					refreshToken: rawRefreshToken,
					user,
				};
			});
		},
	}),
);
