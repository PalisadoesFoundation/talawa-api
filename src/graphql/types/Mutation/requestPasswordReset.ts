import { ulid } from "ulidx";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
    MutationRequestPasswordResetInput,
    mutationRequestPasswordResetInputSchema,
} from "~/src/graphql/inputs/MutationRequestPasswordResetInput";
import { PasswordResetRequestPayload } from "~/src/graphql/types/PasswordResetRequestPayload";
import envConfig from "~/src/utilities/graphqLimits";
import {
    DEFAULT_PASSWORD_RESET_TOKEN_EXPIRES_MS,
    generatePasswordResetToken,
    hashPasswordResetToken,
    revokeAllUserPasswordResetTokens,
    storePasswordResetToken,
} from "~/src/utilities/passwordResetTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { emailService } from "~/src/services/ses/emailServiceInstance";

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

                const tokenExpiresIn =
                    ctx.envConfig.API_PASSWORD_RESET_TOKEN_EXPIRES_IN ??
                    DEFAULT_PASSWORD_RESET_TOKEN_EXPIRES_MS;
                const expiresAt = new Date(Date.now() + tokenExpiresIn);

                await storePasswordResetToken(
                    ctx.drizzleClient,
                    existingUser.id,
                    tokenHash,
                    expiresAt,
                );

                // Build reset link
                const frontendUrl = ctx.envConfig.FRONTEND_URL;
                const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

                // Send email (fire and forget - don't block response)
                try {
                    await emailService.sendEmail({
                        id: ulid(),
                        email: existingUser.emailAddress,
                        subject: "Reset Your Password",
                        htmlBody: `
							<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
								<h1 style="color: #333;">Password Reset Request</h1>
								<p>Hello ${existingUser.name},</p>
								<p>We received a request to reset your password. Click the button below to create a new password:</p>
								<div style="text-align: center; margin: 30px 0;">
									<a href="${resetLink}" 
									   style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block;">
										Reset Password
									</a>
								</div>
								<p>Or copy and paste this link into your browser:</p>
								<p style="word-break: break-all; color: #666;">${resetLink}</p>
								<p><strong>This link will expire in 1 hour.</strong></p>
								<p>If you didn't request this password reset, you can safely ignore this email.</p>
								<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
								<p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
							</div>
						`,
                        userId: existingUser.id,
                    });
                } catch (emailError) {
                    // Log error but don't fail the request
                    ctx.log.error(
                        { error: emailError instanceof Error ? emailError.message : "Unknown error" },
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
