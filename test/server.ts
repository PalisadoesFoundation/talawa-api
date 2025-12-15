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
		 * This makes the server test instance listen on a random port that is free at the time of initialization.
		 */
		API_PORT: undefined,
		/**
		 * This makes the server test instance connect to the minio test server.
		 */
		API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
		/**
		 * This makes the server test instance connect to the postgres test database.
		 */
		API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
		/**
		 * This makes the server test instance connect to the redis test database.
		 */
		API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
	},
});
