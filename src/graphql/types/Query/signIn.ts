import { verify } from "@node-rs/argon2";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	QuerySignInInput,
	querySignInInputSchema,
} from "~/src/graphql/inputs/QuerySignInInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import envConfig from "~/src/utilities/graphqLimits";
import { validateRecaptchaIfRequired } from "~/src/utilities/recaptchaUtils";
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	generateRefreshToken,
	hashRefreshToken,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { CurrentClient } from "../../context";

const querySignInArgumentsSchema = z.object({
	input: querySignInInputSchema,
});

builder.queryField("signIn", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QuerySignInInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field for a client to sign in to talawa.",
		resolve: async (_parent, args, ctx) => {
			if (ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = querySignInArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			// Verify reCAPTCHA if required
			await validateRecaptchaIfRequired(
				parsedArgs.input.recaptchaToken,
				ctx.envConfig.RECAPTCHA_SECRET_KEY,
				["input", "recaptchaToken"],
				ctx.log,
			);

			const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, parsedArgs.input.emailAddress),
			});

			// Check if account is locked (only if user exists)
			// This reveals account existence but is necessary for UX to show retry time
			if (existingUser?.lockedUntil && existingUser.lockedUntil > new Date()) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "account_locked",
						retryAfter: existingUser.lockedUntil.toISOString(),
					},
				});
			}

			// Dummy password hash for timing attack mitigation when user doesn't exist
			// This ensures both code paths take approximately the same execution time
			// Uses matching argon2id parameters (m=19456,t=2,p=1) as the default hash function
			const dummyPasswordHash =
				"$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$CTFhFdXPJO1aFaMaO6Mm5c8y7cJHAph8ArZWb2GRPPc";

			// Use the actual password hash if user exists, otherwise use dummy hash
			const passwordHashToVerify =
				existingUser?.passwordHash ?? dummyPasswordHash;

			// Perform password verification regardless of whether user exists
			let isPasswordValid = false;
			try {
				isPasswordValid = await verify(
					passwordHashToVerify,
					parsedArgs.input.password,
				);
			} catch (error) {
				// Hash verification failed (e.g., malformed hash) - treat as invalid
				// Log at debug level for system monitoring without exposing sensitive data
				ctx.log.debug(
					{ error: error instanceof Error ? error.message : "Unknown error" },
					"Password hash verification failed unexpectedly",
				);
				isPasswordValid = false;
			}

			// Return the same error for both invalid email and invalid password
			// This prevents email enumeration attacks
			if (existingUser === undefined || !isPasswordValid) {
				// Increment failed login attempts if user exists
				if (existingUser !== undefined) {
					const lockoutThreshold =
						ctx.envConfig.API_ACCOUNT_LOCKOUT_THRESHOLD ?? 5;
					const lockoutDuration =
						ctx.envConfig.API_ACCOUNT_LOCKOUT_DURATION_MS ?? 900000;
					const newFailedAttempts = (existingUser.failedLoginAttempts ?? 0) + 1;

					const updateData: {
						failedLoginAttempts: number;
						lastFailedLoginAt: Date;
						lockedUntil?: Date | null;
					} = {
						failedLoginAttempts: newFailedAttempts,
						lastFailedLoginAt: new Date(),
					};

					// Lock account if threshold exceeded
					if (newFailedAttempts >= lockoutThreshold) {
						updateData.lockedUntil = new Date(Date.now() + lockoutDuration);
					}

					await ctx.drizzleClient
						.update(usersTable)
						.set(updateData)
						.where(eq(usersTable.id, existingUser.id));
				}

				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_credentials",
						issues: [
							{
								argumentPath: ["input"],
								message: "Invalid email address or password.",
							},
						],
					},
				});
			}

			if (existingUser.role === "regular") {
				// Check if the user has administrator role in any organization
				const adminMemberships =
					await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
						where: (fields, operators) =>
							and(
								operators.eq(fields.memberId, existingUser.id),
								operators.eq(fields.role, "administrator"),
							),
					});

				const isAdmin = adminMemberships.length > 0;
				if (isAdmin) {
					existingUser.role = "administrator";
				}
			}

			// TODO: The following code is necessary for continuing the expected graph traversal for unauthenticated clients that triggered this operation because of absence of an authentication context for those clients. This should be removed when authentication flows are seperated from the graphql implementation.

			// @ts-expect-error
			ctx.currentClient.isAuthenticated = true;
			// @ts-expect-error
			ctx.currentClient.user = {
				id: existingUser.id,
			} as CurrentClient["user"];

			// Reset failed login attempts on successful authentication
			if (
				existingUser.failedLoginAttempts > 0 ||
				existingUser.lockedUntil !== null
			) {
				await ctx.drizzleClient
					.update(usersTable)
					.set({
						failedLoginAttempts: 0,
						lockedUntil: null,
						lastFailedLoginAt: null,
					})
					.where(eq(usersTable.id, existingUser.id));
			}

			// Wrap refresh token storage in a transaction for atomicity
			const result = await ctx.drizzleClient.transaction(async (tx) => {
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

				// Store refresh token in database using transaction
				await storeRefreshToken(
					tx,
					existingUser.id,
					refreshTokenHash,
					refreshTokenExpiresAt,
				);

				const accessToken = ctx.jwt.sign({
					user: {
						id: existingUser.id,
					},
				});

				// Set HTTP-Only cookies for web clients if cookie helper is available
				// This protects tokens from XSS attacks by making them inaccessible to JavaScript
				if (ctx.cookie) {
					ctx.cookie.setAuthCookies(accessToken, rawRefreshToken);
				}

				return {
					// Return tokens in response body for mobile clients (backward compatibility)
					// Web clients using cookies can ignore these values
					authenticationToken: accessToken,
					refreshToken: rawRefreshToken,
					user: existingUser,
				};
			});

			return result;
		},
		type: AuthenticationPayload,
	}),
);
