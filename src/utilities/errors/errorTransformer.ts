import type { FastifyError } from "fastify";
import { ZodError } from "zod";
import { ErrorCode } from "./errorCodes";
import { TalawaRestError } from "./TalawaRestError";

/**
 * Normalized error structure used internally by the error handling system.
 *
 * This type represents the standardized format that all errors are transformed
 * into before being sent as responses.
 */
export type NormalizedError = {
	/** Standardized error code */
	code: ErrorCode;
	/** Human-readable error message */
	message: string;
	/** HTTP status code */
	statusCode: number;
	/** Optional additional error context */
	details?: unknown;
};

/**
 * Transforms various error types into a standardized NormalizedError format.
 *
 * This function handles different error types that can occur in the application
 * and converts them into a consistent format for error responses. It supports:
 * - TalawaRestError (already normalized)
 * - Fastify validation errors
 * - Zod validation errors
 * - Generic Error objects
 * - Unknown error types
 *
 * @param err - The error to normalize (can be any type)
 * @returns Normalized error with consistent structure
 *
 * @example
 * ```ts
 * // TalawaRestError (already normalized)
 * const talawaError = new TalawaRestError({
 *   code: ErrorCode.NOT_FOUND,
 *   message: "User not found"
 * });
 * const normalized1 = normalizeError(talawaError);
 *
 * const genericError = new Error("Something went wrong");
 * const normalized2 = normalizeError(genericError);
 * // Returns: { code: "internal_server_error", message: "Internal Server Error", statusCode: 500 }
 *
 * // Zod validation error
 * const zodError = new ZodError([...]);
 * const normalized3 = normalizeError(zodError);
 * // Returns: { code: "invalid_arguments", message: "Invalid input", statusCode: 400, details: {...} }
 * ```
 */
export function normalizeError(err: unknown): NormalizedError {
	// Already normalized - TalawaRestError instances are passed through as-is
	if (err instanceof TalawaRestError) {
		return {
			code: err.code,
			message: err.message,
			statusCode: err.statusCode,
			details: err.details,
		};
	}

	// Fastify validation error - occurs when request doesn't match schema
	const fe = err as FastifyError & {
		validation?: unknown;
		statusCode?: number;
	};
	if (fe?.validation && typeof fe.statusCode === "number") {
		return {
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Validation failed",
			statusCode: fe.statusCode,
			details: fe.validation,
		};
	}

	// Zod validation error - occurs when data doesn't match Zod schema
	if (err instanceof ZodError) {
		return {
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Invalid input",
			statusCode: 400,
			details: err.flatten ? err.flatten() : err.issues,
		};
	}

	// Fallback for all other error types (generic Error, unknown objects, etc.)
	return {
		code: ErrorCode.INTERNAL_SERVER_ERROR,
		message: "Internal Server Error",
		statusCode: 500,
	};
}
