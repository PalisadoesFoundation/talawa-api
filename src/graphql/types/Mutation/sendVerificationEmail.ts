import { ulid } from "ulidx";
import { builder } from "~/src/graphql/builder";
import { SendEmailVerificationPayload } from "~/src/graphql/types/SendEmailVerificationPayload";
import { emailService } from "~/src/services/email/emailServiceInstance";
import {
	formatExpiryTime,
	getEmailVerificationEmailHtml,
	getEmailVerificationEmailText,
} from "~/src/utilities/emailTemplates";
import { checkEmailVerificationRateLimit } from "~/src/utilities/emailVerificationRateLimit";
import {
	DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS,
	generateEmailVerificationToken,
	hashEmailVerificationToken,
	revokeAllUserEmailVerificationTokens,
	storeEmailVerificationToken,
} from "~/src/utilities/emailVerificationTokenUtils";
import envConfig from "~/src/utilities/graphqLimits";
import { maskEmail } from "~/src/utilities/maskEmail";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.mutationField("sendVerificationEmail", (t) =>
	t.field({
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		description:
			"Send a verification email to the authenticated user. Returns same response whether email was sent or not.",
		resolve: async (_parent, _args, ctx) => {
			// Track start time for timing attack mitigation
			const startTime = Date.now();

			// Must be authenticated to send verification email
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Get the current user
			const userId = ctx.currentClient.user.id;
			const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.id, userId),
			});

			if (!existingUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// If already verified, return success early
			if (existingUser.isEmailAddressVerified) {
				return {
					success: true,
					message: "Your email address is already verified.",
				};
			}

			// Rate limiting: 3 requests per hour per user
			if (!checkEmailVerificationRateLimit(userId)) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "too_many_requests",
					},
					message:
						"Too many verification email requests. Please wait before requesting another one.",
				});
			}

			// Revoke any existing unused verification tokens for this user
			await revokeAllUserEmailVerificationTokens(ctx.drizzleClient, userId);

			// Generate and store new token
			const rawToken = generateEmailVerificationToken();
			const tokenHash = hashEmailVerificationToken(rawToken);

			// Get expiry configuration (default 24 hours)
			const tokenExpiresInSeconds =
				ctx.envConfig.API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS ??
				DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS;

			const expiresAt = new Date(Date.now() + tokenExpiresInSeconds * 1000);

			await storeEmailVerificationToken(
				ctx.drizzleClient,
				userId,
				tokenHash,
				expiresAt,
			);

			// Build verification link using configured frontend URL
			const frontendUrl = ctx.envConfig.API_FRONTEND_URL;
			const verificationLink = `${frontendUrl}/verify-email?token=${rawToken}`;

			// Get community name for email branding
			const communityName = ctx.envConfig.API_COMMUNITY_NAME;

			// Format expiry time for display
			const expiryText = formatExpiryTime(tokenExpiresInSeconds);

			// Send email - we await it, but failures don't block the GraphQL response
			try {
				const emailContext = {
					userName: existingUser.name,
					communityName,
					verificationLink,
					expiryText,
				};

				const emailResult = await emailService.sendEmail({
					id: ulid(),
					email: existingUser.emailAddress,
					subject: `Verify Your Email - ${communityName}`,
					htmlBody: getEmailVerificationEmailHtml(emailContext),
					textBody: getEmailVerificationEmailText(emailContext),
					userId: existingUser.id,
				});

				if (!emailResult.success) {
					ctx.log.error(
						{
							error: emailResult.error,
							maskedEmail: maskEmail(existingUser.emailAddress),
							userId: existingUser.id,
						},
						"Failed to send email verification email",
					);
				}
			} catch (emailError) {
				// Log error but don't fail the request
				ctx.log.error(
					{
						error:
							emailError instanceof Error
								? emailError.message
								: "Unknown error",
					},
					"Failed to send email verification email (exception)",
				);
			}

			// Timing attack mitigation: ensure minimum response time of 200ms
			const MIN_RESPONSE_TIME_MS = 200;
			const elapsed = Date.now() - startTime;
			if (elapsed < MIN_RESPONSE_TIME_MS) {
				await new Promise((resolve) =>
					setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed),
				);
			}

			// Always return the same response
			return {
				success: true,
				message:
					"If your email address is not yet verified, a verification link has been sent to your email.",
			};
		},
		type: SendEmailVerificationPayload,
	}),
);
