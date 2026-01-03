import type { Readable } from "node:stream";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { type BucketItemStat, S3Error } from "minio";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

/**
 * Fastify route plugin for serving objects from MinIO storage.
 *
 * This plugin provides a REST endpoint `/objects/:name` that allows clients to fetch
 * objects from the MinIO server. It demonstrates the use of structured error handling
 * with TalawaRestError for consistent error responses.
 *
 * Features:
 * - Validates object name parameters (1-36 characters)
 * - Handles MinIO S3 errors with appropriate error codes
 * - Sets proper content headers for file downloads
 * - Uses structured error handling for consistent responses
 *
 * @example
 * ```ts
 * // GET /objects/my-file.pdf
 * // Success: Returns file stream with proper headers
 * // Error: Returns structured error response
 * {
 *   "error": {
 *     "code": "not_found",
 *     "message": "No object found with the name \"my-file.pdf\".",
 *     "details": { "name": "my-file.pdf" },
 *     "correlationId": "req-123"
 *   }
 * }
 * ```
 */
export const objects: FastifyPluginAsyncTypebox = async (fastify) => {
	/**
	 * GET /objects/:name - Retrieve an object from MinIO storage
	 *
	 * @param name - Object name to retrieve (1-36 characters)
	 * @returns Object stream with appropriate content headers
	 * @throws {TalawaRestError} NOT_FOUND when object doesn't exist
	 * @throws {TalawaRestError} INTERNAL_SERVER_ERROR for other MinIO errors
	 */
	fastify.get(
		"/objects/:name",
		{
			schema: {
				params: Type.Object({
					name: Type.String({
						maxLength: 36,
						minLength: 1,
					}),
				}),
			},
		},
		async (request, reply) => {
			const { name } = request.params;

			let readableStream: Readable;
			let objectStat: BucketItemStat;

			try {
				[readableStream, objectStat] = await Promise.all([
					fastify.minio.client.getObject(fastify.minio.bucketName, name),
					fastify.minio.client.statObject(fastify.minio.bucketName, name),
				]);
			} catch (error) {
				fastify.log.error(
					error,
					`Error encountered while fetching the object with the name "${name}" from the minio server.`,
				);

				// Map MinIO S3 errors to structured TalawaRestError
				// Reference: MinIO error codes and minio-js error handling
				// https://github.com/minio/minio/blob/330dca9a354cdf445d71979170bbe3d27971d127/cmd/api-errors.go#L676C20-L676C29
				// https://github.com/minio/minio-js/blob/fd12add665720a025a7f2e6a76167f20c34d0e42/src/internal/xml-parser.ts#L72
				if (
					error instanceof S3Error &&
					(error.code === "NoSuchKey" || error.code === "NotFound")
				) {
					throw new TalawaRestError({
						code: ErrorCode.NOT_FOUND,
						message: `No object found with the name "${name}".`,
						details: { name },
					});
				}

				// Handle all other MinIO/S3 errors as internal server errors
				throw new TalawaRestError({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Something went wrong. Please try again later.",
					details:
						error instanceof Error ? { message: error.message } : { error },
				});
			}

			// Set appropriate headers for file download
			reply.headers({
				// Content-Disposition header for inline display with filename
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
				"content-disposition": `inline; filename=${name}`,
				// Content-Type header based on object metadata or default to binary
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types
				"content-type":
					"content-type" in objectStat.metaData &&
					typeof objectStat.metaData["content-type"] === "string"
						? objectStat.metaData["content-type"]
						: "application/octet-stream",
				"content-length": objectStat.size,
			});

			return reply.send(readableStream);
		},
	);
};

export default objects;
