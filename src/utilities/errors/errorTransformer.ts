import type { FastifyError } from "fastify";
import * as z from "zod";
import { rootLogger } from "../logging/logger";
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
		code?: string;
	};

	if (
		fe?.validation &&
		typeof fe.statusCode === "number" &&
		fe.code?.startsWith("FST_ERR_")
	) {
		return {
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Validation failed",
			statusCode: fe.statusCode,
			details: fe.validation,
		};
	}

	// Zod validation error - occurs when data doesn't match Zod schema
	if (err instanceof z.ZodError) {
		return {
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Invalid input",
			statusCode: 400,
			details: z.treeifyError(err),
		};
	}

	// Fallback for all other error types (generic Error, unknown objects, etc.)
	let detailsString: string;
	if (err instanceof Error) {
		detailsString = err.message;
	} else if (err === null) {
		detailsString = "null";
	} else if (err === undefined) {
		detailsString = "undefined";
	} else if (typeof err === "string") {
		detailsString = err;
	} else if (typeof err === "object" && err !== null && "message" in err) {
		// Handle objects with a message property (like GraphQL errors)
		detailsString = String((err as { message: unknown }).message);
	} else {
		detailsString = String(err);
	}

	let details: string | undefined;
	if (process.env.NODE_ENV === "production") {
		details = undefined;
		// Log the original error so we don't lose visibility
		rootLogger.error({
			msg: "Internal Server Error (details suppressed)",
			originalError:
				err instanceof Error
					? {
							message: err.message,
							stack: err.stack,
							name: err.name,
						}
					: err,
			details: detailsString,
		});
	} else {
		details = detailsString;
	}

	return {
		code: ErrorCode.INTERNAL_SERVER_ERROR,
		message: "Internal Server Error",
		statusCode: 500,
		details,
	};
}
