import envSchema from "env-schema";
import { createServer } from "~/src/createServer";
import { envSchemaAjv } from "~/src/envConfigSchema";
import { type TestEnvConfig, testEnvConfigSchema } from "./envConfigSchema";

const testEnvConfig = envSchema<TestEnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: testEnvConfigSchema,
});


export const server = await createServer({
	envConfig: {
		/**
		 * This makes the server test instance listen on a random port that is free at the time of initialization. This way the tests don't make use of ports that are already acquired by other tests or unrelated processes external to the tests. More information at this link: {@link https://fastify.dev/docs/latest/Reference/Server/#listentextresolver}.
		 */
		API_PORT: undefined,
		/**
		 * This makes the server test instance connect to the minio test server.
		 */
		API_MINIO_END_POINT: "localhost",
		/**
		 * This makes the server test instance connect to the postgres test database.
		 */
		API_POSTGRES_HOST: "localhost",
		API_POSTGRES_USER: "talawa",
		API_POSTGRES_PASSWORD: "password",
		API_POSTGRES_DATABASE: "talawa",
		API_POSTGRES_PORT: 5434,
		/**
		 * This makes the server test instance connect to the redis test database.
		 */
		API_REDIS_HOST: "localhost",
	},
});
