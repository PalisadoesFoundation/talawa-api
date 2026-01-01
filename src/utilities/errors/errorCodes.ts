/**
 * Standardized error codes used across REST and GraphQL endpoints.
 *
 * This enum provides a unified taxonomy of error types that can occur in the Talawa API.
 * Each error code maps to an appropriate HTTP status code and provides consistent
 * error categorization across different API interfaces.
 *
 * @example
 * ```ts
 * // Using in REST endpoint
 * throw new TalawaRestError({
 *   code: ErrorCode.NOT_FOUND,
 *   message: "User not found"
 * });
 *
 * // Using in GraphQL resolver
 * throw new TalawaGraphQLError({
 *   extensions: {
 *     code: ErrorCode.UNAUTHENTICATED
 *   }
 * });
 * ```
 */
export enum ErrorCode {
	/** User must be authenticated to access this resource (HTTP 401) */
	UNAUTHENTICATED = "unauthenticated",
	/** JWT token has expired and needs to be refreshed (HTTP 401) */
	TOKEN_EXPIRED = "token_expired",
	/** JWT token is malformed or invalid (HTTP 401) */
	TOKEN_INVALID = "token_invalid",

	/** User lacks permission to perform this action (HTTP 403) */
	UNAUTHORIZED = "unauthorized",
	/** User role is insufficient for the requested action (HTTP 403) */
	INSUFFICIENT_PERMISSIONS = "insufficient_permissions",

	/** Request arguments failed validation (HTTP 400) */
	INVALID_ARGUMENTS = "invalid_arguments",
	/** Input data validation failed (HTTP 400) */
	INVALID_INPUT = "invalid_input",

	/** Requested resource does not exist (HTTP 404) */
	NOT_FOUND = "not_found",
	/** Resource already exists and cannot be created again (HTTP 409) */
	ALREADY_EXISTS = "already_exists",
	/** Request conflicts with current resource state (HTTP 409) */
	CONFLICT = "conflict",

	/** Required associated resources were not found (HTTP 404) */
	ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND = "arguments_associated_resources_not_found",

	/** Too many requests from client (HTTP 429) */
	RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
	/** Using deprecated API features (HTTP 400) */
	DEPRECATED = "deprecated",

	/** Unexpected server error occurred (HTTP 500) */
	INTERNAL_SERVER_ERROR = "internal_server_error",
	/** Database operation failed (HTTP 500) */
	DATABASE_ERROR = "database_error",
	/** External service is unavailable (HTTP 502) */
	EXTERNAL_SERVICE_ERROR = "external_service_error",
}

/**
 * Maps ErrorCode enum values to their corresponding HTTP status codes.
 *
 * This mapping ensures consistent HTTP status codes are returned for each
 * error type across both REST and GraphQL endpoints.
 *
 * @example
 * ```ts
 * const statusCode = ERROR_CODE_TO_HTTP_STATUS[ErrorCode.NOT_FOUND]; // 404
 * const authStatus = ERROR_CODE_TO_HTTP_STATUS[ErrorCode.UNAUTHENTICATED]; // 401
 * ```
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
	[ErrorCode.UNAUTHENTICATED]: 401,
	[ErrorCode.TOKEN_EXPIRED]: 401,
	[ErrorCode.TOKEN_INVALID]: 401,

	[ErrorCode.UNAUTHORIZED]: 403,
	[ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

	[ErrorCode.INVALID_ARGUMENTS]: 400,
	[ErrorCode.INVALID_INPUT]: 400,

	[ErrorCode.NOT_FOUND]: 404,

	[ErrorCode.ALREADY_EXISTS]: 409,
	[ErrorCode.CONFLICT]: 409,

	[ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND]: 404,

	[ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

	[ErrorCode.DEPRECATED]: 400,

	[ErrorCode.INTERNAL_SERVER_ERROR]: 500,
	[ErrorCode.DATABASE_ERROR]: 500,
	[ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
};

/**
 * Standard error payload structure returned by REST endpoints.
 *
 * This type defines the consistent error response format used across
 * all REST API endpoints in the Talawa API.
 *
 * @example
 * ```json
 * {
 *   "error": {
 *     "code": "not_found",
 *     "message": "User not found",
 *     "details": { "userId": "123" },
 *     "correlationId": "req-abc123"
 *   }
 * }
 * ```
 */
export type StandardErrorPayload = {
	/** Error container object */
	error: {
		/** Standardized error code from ErrorCode enum */
		code: ErrorCode;
		/** Human-readable error message */
		message: string;
		/** Optional additional error context and details */
		details?: unknown;
		/** Request correlation ID for tracing */
		correlationId?: string;
	};
};
