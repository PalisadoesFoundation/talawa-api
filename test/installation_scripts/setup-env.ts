import { vi } from "vitest";

// Set Redis env vars BEFORE any imports to avoid DNS lookups for redis-test
process.env.API_REDIS_HOST = "localhost";
process.env.API_REDIS_PORT = "6379";

// Set MinIO env vars BEFORE any imports to avoid InvalidEndpointError
process.env.API_MINIO_END_POINT = "localhost";
process.env.API_MINIO_PORT = "9000";
process.env.API_MINIO_ACCESS_KEY = "minioadmin";
process.env.API_MINIO_SECRET_KEY = "minioadmin";
process.env.API_MINIO_USE_SSL = "false";

// Set administrator email for tests
process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = "admin@example.com";

// Mock env-schema globally for installation tests to prevent graphqLimits.ts from crashing
vi.mock("env-schema", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...(actual as object),
		envSchema: () => ({
			API_GRAPHQL_SCALAR_FIELD_COST: 1,
			API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
			API_GRAPHQL_OBJECT_FIELD_COST: 1,
			API_GRAPHQL_LIST_FIELD_COST: 1,
			API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
			API_GRAPHQL_MUTATION_BASE_COST: 1,
			API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
		}),
		default: () => ({
			API_GRAPHQL_SCALAR_FIELD_COST: 1,
			API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
			API_GRAPHQL_OBJECT_FIELD_COST: 1,
			API_GRAPHQL_LIST_FIELD_COST: 1,
			API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
			API_GRAPHQL_MUTATION_BASE_COST: 1,
			API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
		}),
	};
});

// Mock ioredis to prevent connection attempts
vi.mock("ioredis", () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			connect: vi.fn(),
			disconnect: vi.fn(),
			on: vi.fn(),
			quit: vi.fn(),
			// Add other methods if needed
		})),
	};
});
