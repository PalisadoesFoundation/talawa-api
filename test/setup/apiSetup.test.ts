import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSetup } from "~/src/setup";

vi.mock("inquirer");

describe("Setup -> apiSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for API configuration and update environment variables", async () => {
		const mockResponses = [
			{ API_BASE_URL: "http://localhost:5000" },
			{ API_HOST: "127.0.0.1" },
			{ API_PORT: "5000" },
			{ API_IS_APPLY_DRIZZLE_MIGRATIONS: "true" },
			{ API_IS_GRAPHIQL: "false" },
			{ API_IS_PINO_PRETTY: "false" },
			{ API_JWT_EXPIRES_IN: "3600000" },
			{ API_JWT_SECRET: "mocked-secret" },
			{ API_LOG_LEVEL: "info" },
			{ API_MINIO_ACCESS_KEY: "mocked-access-key" },
			{ API_MINIO_END_POINT: "mocked-endpoint" },
			{ API_MINIO_PORT: "9001" },
			{ API_MINIO_SECRET_KEY: "mocked-secret-key" },
			{ API_MINIO_TEST_END_POINT: "mocked-test-endpoint" },
			{ API_MINIO_USE_SSL: "true" },
			{ API_POSTGRES_DATABASE: "mocked-database" },
			{ API_POSTGRES_HOST: "mocked-host" },
			{ API_POSTGRES_PASSWORD: "mocked-password" },
			{ API_POSTGRES_PORT: "5433" },
			{ API_POSTGRES_SSL_MODE: "true" },
			{ API_POSTGRES_TEST_HOST: "mocked-test-host" },
			{ API_POSTGRES_USER: "mocked-user" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");

		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		await apiSetup();

		const expectedEnv = {
			API_BASE_URL: "http://localhost:5000",
			API_HOST: "127.0.0.1",
			API_PORT: "5000",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
			API_IS_GRAPHIQL: "false",
			API_IS_PINO_PRETTY: "false",
			API_JWT_EXPIRES_IN: "3600000",
			API_JWT_SECRET: "mocked-secret",
			API_LOG_LEVEL: "info",
			API_MINIO_ACCESS_KEY: "mocked-access-key",
			API_MINIO_END_POINT: "mocked-endpoint",
			API_MINIO_PORT: "9001",
			API_MINIO_SECRET_KEY: "mocked-secret-key",
			API_MINIO_TEST_END_POINT: "mocked-test-endpoint",
			API_MINIO_USE_SSL: "true",
			API_POSTGRES_DATABASE: "mocked-database",
			API_POSTGRES_HOST: "mocked-host",
			API_POSTGRES_PASSWORD: "mocked-password",
			API_POSTGRES_PORT: "5433",
			API_POSTGRES_SSL_MODE: "true",
			API_POSTGRES_TEST_HOST: "mocked-test-host",
			API_POSTGRES_USER: "mocked-user",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(process.env[key]).toBe(value);
		}
	});
});
