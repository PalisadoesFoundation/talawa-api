import { rootLogger } from "~/src/utilities/logging/logger";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

interface RecaptchaVerificationResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	"error-codes"?: string[];
}

/**
 * Verifies a Google reCAPTCHA v2 token by making a request to Google's verification API.
 */
export async function verifyRecaptchaToken(
	token: string,
	secretKey: string,
): Promise<boolean> {
	try {
		const verificationUrl = "https://www.google.com/recaptcha/api/siteverify";
		const params = new URLSearchParams({
			secret: secretKey,
			response: token,
		});

		const response = await fetch(verificationUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});

		const data = (await response.json()) as RecaptchaVerificationResponse;
		return data.success === true;
	} catch (error) {
		// Log the original error for debugging
		rootLogger.error({ err: error }, "reCAPTCHA verification error");
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}
}

/**
 * Validates reCAPTCHA token if required based on environment configuration.
 *
 * @param recaptchaToken - The reCAPTCHA token to verify (optional)
 * @param recaptchaSecretKey - The secret key from environment config
 * @param argumentPath - The GraphQL argument path for error reporting
 * @returns Promise that resolves if verification passes or is not required
 * @throws TalawaGraphQLError if verification fails or is required but missing
 */
export async function validateRecaptchaIfRequired(
	recaptchaToken: string | undefined,
	recaptchaSecretKey: string | undefined,
	argumentPath: string[],
): Promise<boolean | undefined> {
	// If no secret key is configured, skip reCAPTCHA verification
	if (!recaptchaSecretKey) {
		return;
	}

	// If secret key is configured, reCAPTCHA token is required
	if (!recaptchaToken) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath,
						message: "reCAPTCHA token is required.",
					},
				],
			},
		});
	}

	// Verify the reCAPTCHA token
	const isValid = await verifyRecaptchaToken(
		recaptchaToken,
		recaptchaSecretKey,
	);

	if (!isValid) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath,
						message: "Invalid reCAPTCHA token.",
					},
				],
			},
		});
	}
	return true;
}
