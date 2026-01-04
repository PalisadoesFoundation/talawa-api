import { type Static, Type } from "@sinclair/typebox";
import envSchema from "env-schema";
import { envConfigSchema, envSchemaAjv } from "~/src/envConfigSchema";
/**
 * JSON schema of a record of environment variables accessible to the talawa api tests at runtime.
 */
export const testEnvConfigSchema = Type.Object({
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_TEST_END_POINT: envConfigSchema.properties.API_MINIO_END_POINT,
	API_MINIO_TEST_PORT: envConfigSchema.properties.API_MINIO_PORT,
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-HOST}
	 */
	API_MINIO_PUBLIC_BASE_URL: Type.Optional(
		envConfigSchema.properties.API_MINIO_PUBLIC_BASE_URL,
	),
	API_POSTGRES_TEST_HOST: envConfigSchema.properties.API_POSTGRES_HOST,
	API_POSTGRES_TEST_PORT: envConfigSchema.properties.API_POSTGRES_PORT,
	API_REDIS_TEST_HOST: envConfigSchema.properties.API_REDIS_HOST,
	API_REDIS_TEST_PORT: envConfigSchema.properties.API_REDIS_PORT,
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
/**
 * Type of the object containing parsed configuration environment variables.
 */
export type TestEnvConfig = Static<typeof testEnvConfigSchema>;

/**
 * Function to get the test environment configuration.
 * This function parses and validates environment variables for testing.
 */
export function getTestEnvConfig(): TestEnvConfig {
	return envSchema<TestEnvConfig>({
		ajv: envSchemaAjv,
		dotenv: true,
		schema: testEnvConfigSchema,
	});
}

/**
 * Parsed and validated test environment configuration.
 * This constant contains the test environment variables ready for use.
 */
export const testEnvConfig = getTestEnvConfig();
