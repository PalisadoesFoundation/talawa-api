import type { FastifyReply } from "fastify";
import * as z from "zod";
import type { StandardErrorPayload } from "~/src/utilities/errors/errorCodes";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";

const DEFAULT_VALIDATION_MESSAGE = "Validation failed";

function buildErrorPayload(
	code: ErrorCode,
	message: string,
	details: unknown,
	correlationId: string | undefined,
): StandardErrorPayload {
	const error: StandardErrorPayload["error"] = {
		code,
		message,
	};
	if (details !== undefined) {
		error.details = details;
	}
	if (correlationId !== undefined) {
		error.correlationId = correlationId;
	}
	return { error };
}

function firstZodMessage(err: z.ZodError): string {
	const first = err.issues[0];
	return first?.message ?? DEFAULT_VALIDATION_MESSAGE;
}

/**
 * Validates `body` against a Zod schema and either returns the parsed value or sends a 400 response.
 * Does not throw; route handlers can use `if (!body) return;` after calling this.
 *
 * @param reply - Fastify reply instance for sending 400 on validation failure
 * @param schema - Zod schema to validate against
 * @param body - Raw request body (unknown)
 * @returns Parsed value of type T on success, or undefined after sending 400 on failure
 */
export function zReplyParsed<T>(
	reply: FastifyReply,
	schema: z.ZodType<T>,
	body: unknown,
): T | undefined {
	const result = schema.safeParse(body);

	if (result.success) {
		return result.data;
	}

	const correlationId =
		typeof reply.request?.id === "string" ? reply.request.id : undefined;
	const message = firstZodMessage(result.error);
	const details = z.treeifyError(result.error);
	const payload = buildErrorPayload(
		ErrorCode.INVALID_ARGUMENTS,
		message,
		details,
		correlationId,
	);
	reply.status(400).send(payload);
	return undefined;
}
