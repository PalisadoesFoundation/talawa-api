import envSchema from "env-schema";
import { type Static, Type } from "typebox";
import { envConfigSchema, envSchemaAjv } from "~/src/envConfigSchema";
/**
 * JSON schema of a record of environment variables accessible to the talawa api tests at runtime.
 */
export const testEnvConfigSchema = Type.Object({
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_TEST_END_POINT: envConfigSchema.properties.API_MINIO_END_POINT,
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-HOST}
	 */
	API_MINIO_PUBLIC_BASE_URL: Type.Optional(
		envConfigSchema.properties.API_MINIO_PUBLIC_BASE_URL,
	),
	API_POSTGRES_TEST_HOST: envConfigSchema.properties.API_POSTGRES_HOST,
	/**
	 * Port for the test Postgres database (defaults to 5433 for test containers).
	 */
	API_POSTGRES_TEST_PORT: Type.Number({
		minimum: 1,
		maximum: 65535,
		default: 5433,
	}),
	API_REDIS_TEST_HOST: envConfigSchema.properties.API_REDIS_HOST,
	API_ENABLE_EMAIL_QUEUE: Type.Optional(
		envConfigSchema.properties.API_ENABLE_EMAIL_QUEUE,
	),
	MINIO_ROOT_USER: envConfigSchema.properties.MINIO_ROOT_USER,
	/**
	 * Test-only secret for cookie signing.
	 * This default value ensures tests can run without explicitly setting API_COOKIE_SECRET.
	 */
	API_COOKIE_SECRET: Type.String({
		minLength: 32,
		default: "test-cookie-secret-must-be-at-least-32-characters-long",
	}),
});
export const testEnvConfig = envSchema<TestEnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: testEnvConfigSchema,
});

/**
 * Type of the object containing parsed configuration environment variables.
 */
export type TestEnvConfig = Static<typeof testEnvConfigSchema>;
