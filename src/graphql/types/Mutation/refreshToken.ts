import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	findValidRefreshToken,
	generateRefreshToken,
	hashRefreshToken,
	revokeRefreshTokenByHash,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";

const mutationRefreshTokenArgumentsSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required."),
});

builder.mutationField("refreshToken", (t) =>
	t.field({
		args: {
			refreshToken: t.arg.string({
				required: true,
				description: "The refresh token to use for obtaining a new access token.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Mutation to refresh an access token using a valid refresh token. Returns new access and refresh tokens.",
		resolve: async (_parent, args, ctx) => {
			// This mutation should not require authentication since we're using it to get new tokens
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationRefreshTokenArgumentsSchema.safeParse(args);

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

			// Hash the provided refresh token to look it up
			const tokenHash = hashRefreshToken(parsedArgs.refreshToken);

			// Find the refresh token in the database
			const existingToken = await findValidRefreshToken(
				ctx.drizzleClient,
				tokenHash,
			);

			if (!existingToken) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Invalid or expired refresh token.",
				});
			}

			// Get the user associated with this token
			const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, existingToken.userId),
			});

			if (!existingUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "User not found.",
				});
			}

			// Revoke the old refresh token (token rotation for security)
			await revokeRefreshTokenByHash(ctx.drizzleClient, tokenHash);

			// Generate new refresh token
			const newRawRefreshToken = generateRefreshToken();
			const newRefreshTokenHash = hashRefreshToken(newRawRefreshToken);

			// Calculate new refresh token expiry
			const refreshTokenExpiresIn =
				ctx.envConfig.API_REFRESH_TOKEN_EXPIRES_IN ?? 604800000;
			const refreshTokenExpiresAt = new Date(
				Date.now() + refreshTokenExpiresIn,
			);

			// Store new refresh token
			await storeRefreshToken(
				ctx.drizzleClient,
				existingUser.id,
				newRefreshTokenHash,
				refreshTokenExpiresAt,
			);

			// Generate new access token
			const newAccessToken = ctx.jwt.sign({
				user: {
					id: existingUser.id,
				},
			});

			return {
				authenticationToken: newAccessToken,
				refreshToken: newRawRefreshToken,
				user: existingUser,
			};
		},
		type: AuthenticationPayload,
	}),
);
