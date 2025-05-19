import type { Readable } from "node:stream";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { type BucketItemStat, S3Error } from "minio";

/**
 * This fastify route plugin is used to initialize a `/objects/:name` endpoint on the fastify server for clients to fetch objects from the minio server.
 */
export const objects: FastifyPluginAsyncTypebox = async (fastify) => {
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

				// https://github.com/minio/minio/blob/330dca9a354cdf445d71979170bbe3d27971d127/cmd/api-errors.go#L676C20-L676C29
				// https://github.com/minio/minio-js/blob/fd12add665720a025a7f2e6a76167f20c34d0e42/src/internal/xml-parser.ts#L72
				if (
					error instanceof S3Error &&
					(error.code === "NoSuchKey" || error.code === "NotFound")
				) {
					return reply.status(404).send({
						message: `No object found with the name "${name}".`,
					});
				}

				return reply.status(500).send({
					message: "Something went wrong. Please try again later.",
				});
			}

			reply.headers({
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
				"content-disposition": `inline; filename=${name}`,
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types
				"content-type":
					"content-type" in objectStat.metaData &&
					typeof objectStat.metaData["content-type"] === "string"
						? objectStat.metaData["content-type"]
						: "application/octet-stream",
			});

			return reply.send(readableStream);
		},
	);
};

export default objects;
