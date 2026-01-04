import { createServer } from "~/src/createServer";
import { testEnvConfig } from "./envConfigSchema";

export { testEnvConfig };

// Ensure API_COOKIE_SECRET is set in process.env for createServer's internal validation
// This uses the default value from testEnvConfigSchema if not present in env
if (!process.env.API_COOKIE_SECRET) {
	process.env.API_COOKIE_SECRET = testEnvConfig.API_COOKIE_SECRET;
}

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
		/**
		 * This makes the server test instance use the test cookie secret.
		 */
		API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
		/**
		 * Set very high rate limits for testing to prevent test failures due to rate limiting.
		 * Tests run in parallel and generate high volumes of requests.
		 */
		API_RATE_LIMIT_BUCKET_CAPACITY: 1000000, // 1 million requests
		API_RATE_LIMIT_REFILL_RATE: 100000, // 100k requests per second refill
	},
});
