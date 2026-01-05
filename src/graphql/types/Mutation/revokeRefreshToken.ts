import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import envConfig from "~/src/utilities/graphqLimits";
import {
	hashRefreshToken,
	revokeRefreshTokenByHash,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationRevokeRefreshTokenArgumentsSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required."),
});

builder.mutationField("revokeRefreshToken", (t) =>
	t.field({
		args: {
			refreshToken: t.arg.string({
				required: true,
				description: "The refresh token to revoke.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Mutation to revoke a refresh token. Use this for logout functionality to invalidate the refresh token.",
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationRevokeRefreshTokenArgumentsSchema.safeParse(args);

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

			// Revoke the refresh token
			const wasRevoked = await revokeRefreshTokenByHash(
				ctx.drizzleClient,
				tokenHash,
			);

			// Return true if token was revoked, false if not found
			// We don't throw an error for not found to avoid timing attacks
			return wasRevoked;
		},
		type: "Boolean",
	}),
);
