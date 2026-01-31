import fs from "node:fs";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

// Mock env-schema to return costs
vi.mock("env-schema", () => ({
	envSchema: () => ({
		API_GRAPHQL_SCALAR_FIELD_COST: 1,
		API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
		API_GRAPHQL_OBJECT_FIELD_COST: 1,
		API_GRAPHQL_LIST_FIELD_COST: 1,
		API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
		API_GRAPHQL_MUTATION_BASE_COST: 1,
		API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
	}),
}));

describe("Setup Integration", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		vi.clearAllMocks();

		// Default mocks
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue("");
		// Mock promises
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	it("should configure all custom values correctly", async () => {
		// Mock user answers for a full custom setup
		const customAnswers = {
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",
			useDefaultApi: false,
			API_PORT: "5000",
			API_HOST: "127.0.0.1",
			API_BASE_URL: "http://custom-api:5000",
			API_LOG_LEVEL: "warn",
			API_JWT_EXPIRES_IN: "3600",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "false",
			API_IS_GRAPHIQL: "true",
			API_IS_PINO_PRETTY: "true",

			useDefaultMinio: false,
			API_MINIO_END_POINT: "custom-minio",
			API_MINIO_PORT: "9001",
			API_MINIO_USE_SSL: "true",
			API_MINIO_ACCESS_KEY: "custom-access",
			API_MINIO_SECRET_KEY: "custom-secret",

			useDefaultPostgres: false,
			API_POSTGRES_HOST: "custom-postgres",
			API_POSTGRES_PORT: "5433",
			API_POSTGRES_USER: "custom-user",
			API_POSTGRES_PASSWORD: "custom-password",
			API_POSTGRES_DATABASE: "custom-db",
			API_POSTGRES_SSL_MODE: "true",

			useDefaultCloudbeaver: false,
			CLOUDBEAVER_SERVER_NAME: "Custom CB",
			CLOUDBEAVER_SERVER_URL: "http://custom-cb:8978",
			CLOUDBEAVER_ADMIN_NAME: "cb-admin",
			CLOUDBEAVER_ADMIN_PASSWORD: "cb-password",
			CLOUDBEAVER_MAPPED_HOST_IP: "10.0.0.1",
			CLOUDBEAVER_MAPPED_PORT: "8080",

			useDefaultCaddy: false,
			CADDY_TALAWA_API_HOST: "custom-api-host",
			CADDY_TALAWA_API_PORT: "5000",
			CADDY_TALAWA_API_DOMAIN_NAME: "custom.domain",
			CADDY_TALAWA_API_EMAIL: "custom@domain.com",
			CADDY_HTTP_MAPPED_PORT: "8080",
			CADDY_HTTPS_MAPPED_PORT: "8443",
			CADDY_HTTP3_MAPPED_PORT: "8443",

			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@custom.com",
			setupReCaptcha: false,

			// Observability
			API_OTEL_ENABLED: "true",
			API_OTEL_SAMPLING_RATIO: "0.1",

			// Metrics
			API_METRICS_ENABLED: "true",
			API_METRICS_API_KEY: "metrics-key",
			API_METRICS_SLOW_REQUEST_MS: "1000",
			API_METRICS_SLOW_OPERATION_MS: "500",
			API_METRICS_AGGREGATION_ENABLED: "true",
			API_METRICS_AGGREGATION_CRON_SCHEDULE: "0 * * * *",
			API_METRICS_AGGREGATION_WINDOW_MINUTES: "60",
			API_METRICS_CACHE_TTL_SECONDS: "3600",
			API_METRICS_SNAPSHOT_RETENTION_COUNT: "50",
		};

		const promptMock = vi.spyOn(inquirer, "prompt");

		// We need to return answers in chunks as setup() calls prompt() multiple times
		// But inquirer.prompt can mock implementation to return subset of answers based on questions?
		// biome-ignore lint/suspicious/noExplicitAny: Mocking inquirer prompt implementation
		promptMock.mockImplementation((async (_questions: any) => {
			return customAnswers;
			// biome-ignore lint/suspicious/noExplicitAny: Mocking inquirer prompt implementation
		}) as any);

		await setup();

		// Verify process.env was updated
		expect(process.env.API_PORT).toBe("5000");
		expect(process.env.API_HOST).toBe("127.0.0.1");
		expect(process.env.API_MINIO_END_POINT).toBe("custom-minio");
		expect(process.env.API_POSTGRES_HOST).toBe("custom-postgres");
		expect(process.env.API_OTEL_ENABLED).toBe("true");
		expect(process.env.API_METRICS_ENABLED).toBe("true");
		expect(process.env.API_METRICS_API_KEY).toBe("metrics-key");

		// Verify .env file was written
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			".env",
			expect.stringContaining("API_PORT=5000"),
		);
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			".env",
			expect.stringContaining("API_METRICS_API_KEY=metrics-key"),
		);
	});
});
