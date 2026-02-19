import envSchema from "env-schema";
import { createServer } from "~/src/createServer";
import { envSchemaAjv } from "~/src/envConfigSchema";
import { type TestEnvConfig, testEnvConfigSchema } from "./envConfigSchema";



const testEnvConfig = envSchema<TestEnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: testEnvConfigSchema,
});

// Ensure API_COOKIE_SECRET is set in process.env for createServer's internal validation
// This uses the default value from testEnvConfigSchema if not present in env
if (!process.env.API_COOKIE_SECRET) {
	process.env.API_COOKIE_SECRET = testEnvConfig.API_COOKIE_SECRET;
}

/** Satisfies env schema API_AUTH_JWT_SECRET minLength for createServer in tests. */
const TEST_AUTH_JWT_SECRET = "12345678901234567890123456789012";

export const server = await createServer({
	envConfig: {
		/**
		 * This makes the server test instance listen on a random port that is free at the time of initialization.
		 */
		API_PORT: 0,
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
		/**
		 * This makes the server test instance use the test cookie secret.
		 */
		API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
		API_AUTH_JWT_SECRET: TEST_AUTH_JWT_SECRET,
		/**
		 * Set high rate limits for tests to prevent "Too many requests" errors.
		 */
		API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
		API_RATE_LIMIT_REFILL_RATE: 10000,
		API_FRONTEND_URL: "http://localhost:3000",
	},
});
