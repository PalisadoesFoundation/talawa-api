import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationVerifyEmailInput,
	mutationVerifyEmailInputSchema,
} from "~/src/graphql/inputs/MutationVerifyEmailInput";
import { VerifyEmailPayload } from "~/src/graphql/types/VerifyEmailPayload";
import {
	findValidEmailVerificationToken,
	hashEmailVerificationToken,
	markEmailVerificationTokenAsUsed,
} from "~/src/utilities/emailVerificationTokenUtils";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationVerifyEmailArgumentsSchema = z.object({
	input: mutationVerifyEmailInputSchema,
});

builder.mutationField("verifyEmail", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for verifying an email address with a token.",
				required: true,
				type: MutationVerifyEmailInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Verify a user's email address using the token sent to their email. Returns success even if already verified (idempotent).",
		resolve: async (_parent, args, ctx) => {
			// Must be authenticated to verify email
			if (!ctx.currentClient.isAuthenticated) {
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
			} = mutationVerifyEmailArgumentsSchema.safeParse(args);

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

			// Get the current user
			const userId = ctx.currentClient.user.id;
			const [currentUser] = await ctx.drizzleClient
				.select({
					isEmailAddressVerified: usersTable.isEmailAddressVerified,
				})
				.from(usersTable)
				.where(eq(usersTable.id, userId));

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// If already verified, return success (idempotent)
			if (currentUser.isEmailAddressVerified) {
				return {
					success: true,
					message: "Your email address is already verified.",
				};
			}

			// Hash the provided token
			const tokenHash = hashEmailVerificationToken(parsedArgs.input.token);

			// Find valid token
			const validToken = await findValidEmailVerificationToken(
				ctx.drizzleClient,
				tokenHash,
			);

			if (!validToken) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "token"],
								message:
									"Invalid, expired, or already used verification token. Please request a new verification email.",
							},
						],
					},
				});
			}

			// Validate token belongs to the authenticated user
			if (validToken.userId !== userId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
					},
				});
			}

			// Mark token as used and update user's verified status in a transaction
			await ctx.drizzleClient.transaction(async (tx) => {
				// Mark token as used
				const wasMarked = await markEmailVerificationTokenAsUsed(tx, tokenHash);

				if (!wasMarked) {
					// Token was marked as used between our check and now
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "token"],
									message:
										"This verification token has already been used. Please request a new verification email if needed.",
								},
							],
						},
					});
				}

				// Update user's email verification status
				await tx
					.update(usersTable)
					.set({ isEmailAddressVerified: true })
					.where(eq(usersTable.id, userId));
			});

			return {
				success: true,
				message: "Your email address has been successfully verified!",
			};
		},
		type: VerifyEmailPayload,
	}),
);
