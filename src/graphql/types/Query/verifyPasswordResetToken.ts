import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryVerifyPasswordResetTokenInput,
	queryVerifyPasswordResetTokenInputSchema,
} from "~/src/graphql/inputs/QueryVerifyPasswordResetTokenInput";
import { PasswordResetTokenVerification } from "~/src/graphql/types/PasswordResetTokenVerification";
import envConfig from "~/src/utilities/graphqLimits";
import {
	findValidPasswordResetToken,
	hashPasswordResetToken,
} from "~/src/utilities/passwordResetTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryVerifyPasswordResetTokenArgumentsSchema = z.object({
	input: queryVerifyPasswordResetTokenInputSchema,
});

builder.queryField("verifyPasswordResetToken", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for verifying a password reset token.",
				required: true,
				type: QueryVerifyPasswordResetTokenInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Verify if a password reset token is valid and not expired. Use this before showing the password reset form.",
		resolve: async (_parent, args, ctx) => {
			// Authenticated users should not verify password reset tokens
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
			} = queryVerifyPasswordResetTokenArgumentsSchema.safeParse(args);

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
				return {
					valid: false,
					expiresAt: null,
				};
			}

			return {
				valid: true,
				expiresAt: tokenRecord.expiresAt,
			};
		},
		type: PasswordResetTokenVerification,
	}),
);
