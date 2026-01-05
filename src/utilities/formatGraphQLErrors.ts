import type { GraphQLError } from "graphql";
import {
	ERROR_CODE_TO_HTTP_STATUS,
	ErrorCode,
} from "~/src/utilities/errors/errorCodes";

// Define the shape of the formatted error based on what was in errorFormatter
export interface FormattedGraphQLError {
	message: string;
	locations?: ReadonlyArray<{ line: number; column: number }>;
	path?: ReadonlyArray<string | number>;
	extensions: {
		code: string;
		details?: unknown;
		correlationId: string;
		httpStatus: number;
		[key: string]: unknown;
	};
}

/**
 * Normalizes raw error codes to standard ErrorCode values.
 * Handles legacy error codes by mapping them to current standards.
 *
 * @param rawCode - The raw error code string from the error
 * @returns The corresponding ErrorCode enum value
 */
export function normalizeErrorCode(rawCode?: string): ErrorCode {
	switch (rawCode) {
		case "too_many_requests":
			return ErrorCode.RATE_LIMIT_EXCEEDED;
		case "forbidden_action_on_arguments_associated_resources":
			return ErrorCode.UNAUTHORIZED;
		case "invalid_credentials":
			return ErrorCode.UNAUTHENTICATED;
		case "account_locked":
			return ErrorCode.UNAUTHORIZED;
		case "unauthorized_action":
		case "unauthorized_arguments":
			return ErrorCode.INSUFFICIENT_PERMISSIONS;
	}

	if (rawCode && Object.values(ErrorCode).includes(rawCode as ErrorCode)) {
		return rawCode as ErrorCode;
	}

	return ErrorCode.INTERNAL_SERVER_ERROR;
}

/**
 * Sanitizes the extensions object by removing sensitive keys and preserving safe ones.
 *
 * @param extensions - The original extensions object
 * @returns A new object with sanitized extensions
 */
export function sanitizeExtensions(
	extensions?: Record<string, unknown>,
): Record<string, unknown> {
	const sensitiveKeys = new Set([
		"stack", // Stack trace (internal implementation details)
		"internal", // Internal error details
		"debug", // Debugging information
		"raw", // Raw error object
		"error", // Error object
		"secrets", // Secrets/credentials
		"exception", // Exception details
	]);
	const sanitized: Record<string, unknown> = {};

	if (extensions && typeof extensions === "object") {
		for (const [key, value] of Object.entries(extensions)) {
			// Handle "error" key specifically to scrub sensitive subfields if it's an object
			if (key === "error" && typeof value === "object" && value !== null) {
				const { stack, internal, raw, exception, ...safeError } =
					value as Record<string, unknown>;
				// Only include the sanitized error object if it has safe properties
				if (Object.keys(safeError).length > 0) {
					sanitized[key] = safeError;
				}
				continue;
			}

			// Skip all sensitive keys (including "error" when it's not an object)
			if (sensitiveKeys.has(key)) {
				continue;
			}

			// Only include safe keys
			if (typeof key === "string" && key.length > 0) {
				sanitized[key] = value;
			}
		}
	}
	return sanitized;
}

export interface Logger {
	error: (obj: unknown) => void;
}

/**
 * formats GraphQL errors, sanitizes extensions, determines status codes, and logs errors.
 *
 * @param errors - The list of GraphQL errors to format
 * @param correlationId - The correlation ID for request tracing
 * @param logger - Optional logger for error logging
 * @param httpStatusCode - The actual HTTP status code to log (200 for HTTP, mapped code for subscriptions)
 * @returns Object containing formatted errors and the combined status code
 */
export function formatGraphQLErrors(
	errors: ReadonlyArray<GraphQLError>,
	correlationId: string,
	logger?: Logger,
	httpStatusCode?: number,
): { formatted: FormattedGraphQLError[]; statusCode: number } {
	const formatted = errors.map((e) => {
		const rawCode = e.extensions?.code as string | undefined;
		const normalizedCode = normalizeErrorCode(rawCode);

		// Determine HTTP status: specific override > mapped from code > default 500
		const httpStatus =
			(e.extensions?.httpStatus as number) ??
			ERROR_CODE_TO_HTTP_STATUS[normalizedCode] ??
			500;

		const sanitizedExtensions = sanitizeExtensions(
			e.extensions as Record<string, unknown>,
		);

		return {
			message: e.message,
			locations: e.locations,
			path: e.path,
			extensions: {
				// Spread sanitized extensions first so they can't override our standardized keys
				...sanitizedExtensions,
				// Use original rawCode if present to preserve external behavior, else normalized
				code: rawCode ?? normalizedCode,
				details: e.extensions?.details,
				correlationId,
				httpStatus,
			},
		};
	});

	const statusCode = formatted[0]?.extensions?.httpStatus ?? 500;

	if (logger) {
		logger.error({
			msg: "GraphQL error",
			correlationId,
			statusCode: httpStatusCode ?? statusCode,
			errors: formatted.map((fe) => ({
				message: fe.message,
				code: fe.extensions?.code,
				details: fe.extensions?.details,
			})),
		});
	}

	return { formatted, statusCode };
}
