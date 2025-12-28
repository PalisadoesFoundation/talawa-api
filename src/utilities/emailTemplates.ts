/**
 * Email template utilities for generating non-branded, self-hosted email content.
 * Templates use the configured community name and avoid external branding.
 */

export interface PasswordResetEmailContext {
	userName: string;
	communityName: string;
	resetLink: string;
	expiryText: string;
}

/**
 * Generates plain text email content for password reset.
 * Non-branded, uses configured community name.
 */
export function getPasswordResetEmailText(
	ctx: PasswordResetEmailContext,
): string {
	return `Hello ${ctx.userName},

We received a request to reset your password for your ${ctx.communityName} account.

Reset your password by visiting this link:
${ctx.resetLink}

${ctx.expiryText ? `This link will expire in ${ctx.expiryText}.` : "This link does not expire."}

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The ${ctx.communityName} Team

---
This is an automated message. Please do not reply to this email.`;
}

/**
 * Generates HTML email content for password reset.
 * Simple, non-branded design using community name.
 */
export function getPasswordResetEmailHtml(
	ctx: PasswordResetEmailContext,
): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - ${ctx.communityName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; border-radius: 8px; padding: 30px;">
    <h1 style="color: #333; margin-top: 0; font-size: 24px;">Password Reset Request</h1>
    
    <p>Hello ${ctx.userName},</p>
    
    <p>We received a request to reset your password for your <strong>${ctx.communityName}</strong> account.</p>
    
    <p>Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${ctx.resetLink}" 
         style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${ctx.resetLink}</p>
    
    <p style="margin-top: 20px;">
      ${ctx.expiryText ? `<strong>This link will expire in ${ctx.expiryText}.</strong>` : "<strong>This link does not expire.</strong>"}
    </p>
    
    <p style="color: #666;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
    
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      This is an automated message from ${ctx.communityName}. Please do not reply to this email.
    </p>
  </div>
</body>
</html>`;
}

/**
 * Formats expiry time in seconds to human-readable text.
 * Returns empty string if expiry is 0 (no timeout).
 */
export function formatExpiryTime(expirySeconds: number): string {
	if (expirySeconds === 0) {
		return "";
	}

	const minutes = Math.floor(expirySeconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days >= 1) {
		return days === 1 ? "1 day" : `${days} days`;
	}
	if (hours >= 1) {
		return hours === 1 ? "1 hour" : `${hours} hours`;
	}

	// Clamp sub-minute values to 1 minute to avoid "0 minutes"
	const displayMinutes = Math.max(1, minutes);
	return displayMinutes === 1 ? "1 minute" : `${displayMinutes} minutes`;
}
