import {
	ERROR_CODE_TO_HTTP_STATUS,
	type ErrorCode,
	type StandardErrorPayload,
} from "./errorCodes";

/**
 * Custom error class for REST API endpoints with standardized error codes and HTTP status mapping.
 *
 * TalawaRestError provides a structured way to throw errors in REST routes that will be
 * automatically transformed by the global error handler into consistent error responses.
 *
 * @example
 * ```ts
 * // Basic usage
 * throw new TalawaRestError({
 *   code: ErrorCode.NOT_FOUND,
 *   message: "User not found"
 * });
 *
 * // With additional details
 * throw new TalawaRestError({
 *   code: ErrorCode.NOT_FOUND,
 *   message: "User not found",
 *   details: { userId: "123", requestedBy: "admin" }
 * });
 *
 * // With custom status code override
 * throw new TalawaRestError({
 *   code: ErrorCode.NOT_FOUND,
 *   message: "Custom error",
 *   statusCodeOverride: 418
 * });
 * ```
 */
export class TalawaRestError extends Error {
	/** The standardized error code */
	public readonly code: ErrorCode;
	/** HTTP status code for this error */
	public readonly statusCode: number;
	/** Optional additional error context */
	public readonly details?: unknown;

	/**
	 * Creates a new TalawaRestError instance.
	 *
	 * @param args - Error configuration object
	 * @param args.code - Standardized error code from ErrorCode enum
	 * @param args.message - Human-readable error message
	 * @param args.details - Optional additional error context and details
	 * @param args.statusCodeOverride - Optional HTTP status code override
	 */
	constructor(args: {
		code: ErrorCode;
		message: string;
		details?: unknown;
		statusCodeOverride?: number;
	}) {
		super(args.message);
		this.name = "TalawaRestError";
		this.code = args.code;
		this.details = args.details;
		this.statusCode =
			args.statusCodeOverride ?? ERROR_CODE_TO_HTTP_STATUS[args.code] ?? 500;
	}

	/**
	 * Converts the error to a standardized JSON response format.
	 *
	 * This method is used by the global error handler to create consistent
	 * error responses for REST endpoints.
	 *
	 * @param correlationId - Optional request correlation ID for tracing
	 * @returns Standardized error payload object
	 *
	 * @example
	 * ```ts
	 * const error = new TalawaRestError({
	 *   code: ErrorCode.NOT_FOUND,
	 *   message: "User not found",
	 *   details: { userId: "123" }
	 * });
	 *
	 * const payload = error.toJSON("req-abc123");
	 * // Returns: {
	 * //   error: {
	 * //     code: "not_found",
	 * //     message: "User not found",
	 * //     details: { userId: "123" },
	 * //     correlationId: "req-abc123"
	 * //   }
	 * // }
	 * ```
	 */
	toJSON(correlationId?: string): StandardErrorPayload {
		const error: StandardErrorPayload["error"] = {
			code: this.code,
			message: this.message,
		};

		if (this.details !== undefined) {
			error.details = this.details;
		}

		if (correlationId !== undefined) {
			error.correlationId = correlationId;
		}

		return { error };
	}
}
