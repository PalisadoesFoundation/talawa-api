import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationResetPasswordInput,
	mutationResetPasswordInputSchema,
} from "~/src/graphql/inputs/MutationResetPasswordInput";
import { PasswordResetPayload } from "~/src/graphql/types/PasswordResetPayload";
import envConfig from "~/src/utilities/graphqLimits";
import {
	findValidPasswordResetToken,
	hashPasswordResetToken,
	markPasswordResetTokenAsUsed,
} from "~/src/utilities/passwordResetTokenUtils";
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	generateRefreshToken,
	hashRefreshToken,
	revokeAllUserRefreshTokens,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationResetPasswordArgumentsSchema = z.object({
	input: mutationResetPasswordInputSchema,
});

builder.mutationField("resetPassword", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for resetting password with a valid token.",
				required: true,
				type: MutationResetPasswordInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Reset password using a valid password reset token. Returns authentication tokens for auto-login.",
		resolve: async (_parent, args, ctx) => {
			// Authenticated users should not reset password via token
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
			} = mutationResetPasswordArgumentsSchema.safeParse(args);

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

			// Hash the token and look it up
			const tokenHash = hashPasswordResetToken(parsedArgs.input.token);
			const tokenRecord = await findValidPasswordResetToken(
				ctx.drizzleClient,
				tokenHash,
			);

			if (!tokenRecord) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "token"],
								message: "Invalid or expired password reset token.",
							},
						],
					},
				});
			}

			// Get the user associated with this token
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, tokenRecord.userId),
			});

			if (!user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// Perform all operations in a transaction
			const result = await ctx.drizzleClient.transaction(async (tx) => {
				// Hash the new password
				const passwordHash = await hash(parsedArgs.input.newPassword);

				// Update user's password
				await tx
					.update(usersTable)
					.set({
						passwordHash,
						// Reset any lockout state as well
						failedLoginAttempts: 0,
						lockedUntil: null,
						lastFailedLoginAt: null,
					})
					.where(eq(usersTable.id, user.id));

				// Mark the token as used
				await markPasswordResetTokenAsUsed(tx, tokenHash);

				// Revoke all existing refresh tokens for security
				await revokeAllUserRefreshTokens(tx, user.id);

				// Generate new refresh token for auto-login
				const rawRefreshToken = generateRefreshToken();
				const refreshTokenHash = hashRefreshToken(rawRefreshToken);

				const refreshTokenExpiresIn =
					ctx.envConfig.API_REFRESH_TOKEN_EXPIRES_IN ??
					DEFAULT_REFRESH_TOKEN_EXPIRES_MS;
				const refreshTokenExpiresAt = new Date(
					Date.now() + refreshTokenExpiresIn,
				);

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

				return {
					success: true,
					authenticationToken: accessToken,
					refreshToken: rawRefreshToken,
				};
			});

			return result;
		},
		type: PasswordResetPayload,
	}),
);
