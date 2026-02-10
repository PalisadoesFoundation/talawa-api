import { rootLogger } from "~/src/utilities/logging/logger";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

interface RecaptchaVerificationResponse {
	success: boolean;
	score?: number; // v3 only: 0.0-1.0, higher = more likely human
	action?: string; // v3 only: action name from the request
	challenge_ts?: string;
	hostname?: string;
	"error-codes"?: string[];
}

/**
 * Verifies a Google reCAPTCHA v3 token by making a request to Google's verification API.
 *
 * @param token - The reCAPTCHA token to verify
 * @param secretKey - The secret key for verification
 * @param expectedAction - The expected action name (optional, for additional validation)
 * @param scoreThreshold - Minimum score threshold (0.0-1.0, default 0.5)
 * @returns A promise resolving to an object with success status, and optional score and action fields
 */
export async function verifyRecaptchaToken(
	token: string,
	secretKey: string,
	expectedAction?: string,
	scoreThreshold: number = 0.5,
): Promise<{ success: boolean; score?: number; action?: string }> {
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

		// Check basic success
		if (!data.success) {
			return { success: false, score: data.score, action: data.action };
		}

		// For v3, also check score and action
		if (data.score !== undefined) {
			// Validate score threshold
			if (data.score < scoreThreshold) {
				return { success: false, score: data.score, action: data.action };
			}

			// Validate action if provided
			if (expectedAction && data.action !== expectedAction) {
				return { success: false, score: data.score, action: data.action };
			}
		}

		return { success: true, score: data.score, action: data.action };
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
 * @param action - The expected action name for v3 validation
 * @param scoreThreshold - Minimum score threshold (0.0-1.0, default 0.5)
 * @returns Promise that resolves if verification passes or is not required
 * @throws TalawaGraphQLError if verification fails or is required but missing
 */
export async function validateRecaptchaIfRequired(
	recaptchaToken: string | undefined,
	recaptchaSecretKey: string | undefined,
	argumentPath: string[],
	action?: string,
	scoreThreshold: number = 0.5,
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
	const result = await verifyRecaptchaToken(
		recaptchaToken,
		recaptchaSecretKey,
		action,
		scoreThreshold,
	);

	if (!result.success) {
		// Log detailed failure info server-side only
		rootLogger.warn(
			{
				score: result.score,
				expectedAction: action,
				actualAction: result.action,
				scoreThreshold,
			},
			"reCAPTCHA verification failed",
		);

		// Return a generic message to the client to avoid leaking score/action details
		const message = "reCAPTCHA verification failed. Please try again.";

		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath,
						message,
					},
				],
			},
		});
	}
	return true;
}
