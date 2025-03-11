import { type Static, Type } from "@sinclair/typebox";
import envSchema from "env-schema";
import { envConfigSchema } from "~/src/envConfigSchema";
import { envSchemaAjv } from "~/src/envConfigSchema";
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
	API_POSTGRES_TEST_HOST: envConfigSchema.properties.API_POSTGRES_HOST,
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
