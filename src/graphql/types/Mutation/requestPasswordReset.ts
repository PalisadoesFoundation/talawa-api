import { ulid } from "ulidx";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	MutationRequestPasswordResetInput,
	mutationRequestPasswordResetInputSchema,
} from "~/src/graphql/inputs/MutationRequestPasswordResetInput";
import { PasswordResetRequestPayload } from "~/src/graphql/types/PasswordResetRequestPayload";
import { emailService } from "~/src/services/ses/emailServiceInstance";
import {
	formatExpiryTime,
	getPasswordResetEmailHtml,
} from "~/src/utilities/emailTemplates";
import envConfig from "~/src/utilities/graphqLimits";
import {
	DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS,
	generatePasswordResetToken,
	hashPasswordResetToken,
	revokeAllUserPasswordResetTokens,
	storePasswordResetToken,
} from "~/src/utilities/passwordResetTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationRequestPasswordResetArgumentsSchema = z.object({
	input: mutationRequestPasswordResetInputSchema,
});

builder.mutationField("requestPasswordReset", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for requesting a password reset.",
				required: true,
				type: MutationRequestPasswordResetInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Request a password reset. If the email exists, a reset link will be sent. Returns the same response whether the email exists or not to prevent user enumeration.",
		resolve: async (_parent, args, ctx) => {
			// Authenticated users should not request password reset
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
			} = mutationRequestPasswordResetArgumentsSchema.safeParse(args);

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

			// Look up user by email - but we'll return the same response regardless
			const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, parsedArgs.input.emailAddress),
			});

			// Only process if user exists, but always return same response
			if (existingUser) {
				// Revoke any existing unused password reset tokens for this user
				await revokeAllUserPasswordResetTokens(
					ctx.drizzleClient,
					existingUser.id,
				);

				// Generate and store new token
				const rawToken = generatePasswordResetToken();
				const tokenHash = hashPasswordResetToken(rawToken);

				// Use user portal expiry for regular users (seconds)
				// Admin portal expiry would be used for admin users (to be determined by user role)
				const tokenExpiresInSeconds =
					ctx.envConfig.API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS ??
					DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS;

				// 0 = no timeout (token never expires)
				const expiresAt =
					tokenExpiresInSeconds === 0
						? null
						: new Date(Date.now() + tokenExpiresInSeconds * 1000);

				await storePasswordResetToken(
					ctx.drizzleClient,
					existingUser.id,
					tokenHash,
					expiresAt,
				);

				// Build reset link using configured frontend URL
				const frontendUrl = ctx.envConfig.FRONTEND_URL;
				const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

				// Get community name for email branding
				const communityName = ctx.envConfig.API_COMMUNITY_NAME;

				// Format expiry time for display (empty string if no timeout)
				const expiryText = formatExpiryTime(tokenExpiresInSeconds);

				// Send email (fire and forget - don't block response)
				try {
					const emailContext = {
						userName: existingUser.name,
						communityName,
						resetLink,
						expiryText,
					};

					await emailService.sendEmail({
						id: ulid(),
						email: existingUser.emailAddress,
						subject: `Reset Your Password - ${communityName}`,
						htmlBody: getPasswordResetEmailHtml(emailContext),
						userId: existingUser.id,
					});
				} catch (emailError) {
					// Log error but don't fail the request
					ctx.log.error(
						{
							error:
								emailError instanceof Error
									? emailError.message
									: "Unknown error",
						},
						"Failed to send password reset email",
					);
				}
			}

			// Always return the same response to prevent email enumeration
			return {
				success: true,
				message:
					"If an account with this email exists, a password reset link has been sent.",
			};
		},
		type: PasswordResetRequestPayload,
	}),
);
