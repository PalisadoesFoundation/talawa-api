import fastifyPlugin from "fastify-plugin";
import { Client as MinioClient } from "minio";

declare module "fastify" {
	interface FastifyInstance {
		minio: {
			bucketName: "talawa";
			client: MinioClient;
			config: {
				endPoint: string;
				port: number;
			};
		};
	}
}

/**
 * Integrates the talawa minio bucket name and a minio client instance on the namespaces `minio.bucketName` and `minio.client` respectively on the global fastify instance.
 *
 * @example
 * import minioClientPlugin from "~src/plugins/minioClient";
 *
 * fastify.register(minioClientPlugin, {});
 * const buckets = await fastify.minio.client.listBuckets();
 */
export const minioClient = fastifyPlugin(async (fastify) => {
	let ClientClass = MinioClient;

	/**
	 * Override the default request options for MinIO client.
	 * This method customizes the request options by setting a specific host for local development.
	 *
	 * @param opts - Configuration options for the request
	 * @param opts.region - Optional AWS region (defaults to "us-east-1")
	 * @param opts.method - HTTP method for the request
	 * @param opts.bucketName - Optional name of the bucket
	 * @param opts.objectName - Optional name of the object
	 * @param opts.queryParams - Optional key-value pairs for query parameters
	 * @param opts.customHeaders - Optional custom HTTP headers
	 *
	 * @returns Modified request options with localhost:9000 as host
	 * @override
	 */
	if (process.env.NODE_ENV !== "production") {
		ClientClass = class extends MinioClient {
			protected override getRequestOptions(opts: {
				region?: string;
				method: string;
				bucketName?: string;
				objectName?: string;
				queryParams?: { [key: string]: string };
				customHeaders?: { [key: string]: string };
			}) {
				const options = { ...opts, region: opts.region || "us-east-1" };
				const requestOptions = super.getRequestOptions(options);
				requestOptions.headers.host = "localhost:9000";
				return requestOptions;
			}
		};
	}

	const client = new ClientClass({
		accessKey: fastify.envConfig.API_MINIO_ACCESS_KEY,
		endPoint: fastify.envConfig.API_MINIO_END_POINT,
		port: fastify.envConfig.API_MINIO_PORT,
		secretKey: fastify.envConfig.API_MINIO_SECRET_KEY,
		useSSL: fastify.envConfig.API_MINIO_USE_SSL,
	});

	let isBucketExists: boolean | undefined = undefined;

	try {
		fastify.log.info("Checking the connection to the minio server.");
		isBucketExists = await client.bucketExists("talawa");
		fastify.log.info("Successfully connected to the minio server.");
	} catch (error) {
		throw new Error("Failed to connect to the minio server.", {
			cause: error,
		});
	}

	fastify.log.info(
		`Checking if the "talawa" bucket exists in the minio server.`,
	);

	if (isBucketExists) {
		fastify.log.info(
			`"talawa" bucket already exists in the minio server. Skipping, the bucket creation.`,
		);
	} else {
		try {
			fastify.log.info(`Creating the "talawa" bucket in the minio server.`);
			await client.makeBucket("talawa");
			fastify.log.info(
				`Successfully created the "talawa" bucket in the minio server.`,
			);
		} catch (error) {
			throw new Error(
				`Failed to create the "talawa" bucket in the minio server.`,
				{
					cause: error,
				},
			);
		}
	}

	fastify.decorate("minio", {
		bucketName: "talawa",
		client,
		config: {
			endPoint: fastify.envConfig.API_MINIO_END_POINT,
			port: fastify.envConfig.API_MINIO_PORT,
		},
	});
}, {});

export default minioClient;
