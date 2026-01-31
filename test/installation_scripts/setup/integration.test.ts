import fs from "node:fs";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

vi.mock("scripts/setup/envFileBackup/envFileBackup", () => ({
	envFileBackup: vi.fn().mockResolvedValue(false),
}));

describe("Setup Integration", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
		try {
			if (fs.existsSync(".env")) {
				fs.unlinkSync(".env");
			}
		} catch {}
	});

	it("should configure all custom values correctly", async () => {
		if (fs.existsSync(".env")) {
			fs.unlinkSync(".env");
		}

		// Mock user answers for a full custom setup
		// Passwords must match the env file defaults (MINIO_ROOT_PASSWORD and
		// POSTGRES_PASSWORD from envFiles/.env.devcontainer are both "password")
		// because apiSetup validates that API_MINIO_SECRET_KEY matches
		// MINIO_ROOT_PASSWORD and API_POSTGRES_PASSWORD matches POSTGRES_PASSWORD.
		const customAnswers: Record<string, string | boolean> = {
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",

			// apiSetup prompts
			useDefaultApi: false,
			API_BASE_URL: "http://custom-api:5000",
			API_HOST: "127.0.0.1",
			API_PORT: "5000",
			API_IS_APPLY_DRIZZLE_MIGRATIONS: "false",
			API_IS_GRAPHIQL: "true",
			API_IS_PINO_PRETTY: "true",
			API_JWT_EXPIRES_IN: "3600",
			API_JWT_SECRET: "a".repeat(128),
			API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS: "86400",
			API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET: "b".repeat(32),
			API_LOG_LEVEL: "debug",
			API_MINIO_ACCESS_KEY: "custom-access",
			API_MINIO_END_POINT: "custom-minio",
			API_MINIO_PORT: "9001",
			API_MINIO_SECRET_KEY: "password",
			API_MINIO_TEST_END_POINT: "minio-test",
			API_MINIO_USE_SSL: "false",
			API_POSTGRES_DATABASE: "custom-db",
			API_POSTGRES_HOST: "custom-postgres",
			API_POSTGRES_PASSWORD: "password",
			API_POSTGRES_PORT: "5433",
			API_POSTGRES_SSL_MODE: "false",
			API_POSTGRES_TEST_HOST: "custom-postgres-test",
			API_POSTGRES_USER: "custom-user",

			// minioSetup prompts
			useDefaultMinio: false,
			MINIO_BROWSER: "on",
			MINIO_API_MAPPED_HOST_IP: "0.0.0.0",
			MINIO_API_MAPPED_PORT: "9000",
			MINIO_CONSOLE_MAPPED_HOST_IP: "0.0.0.0",
			MINIO_CONSOLE_MAPPED_PORT: "9001",
			MINIO_ROOT_PASSWORD: "password",
			MINIO_ROOT_USER: "talawa",

			// cloudbeaverSetup prompts
			useDefaultCloudbeaver: false,
			CLOUDBEAVER_ADMIN_NAME: "cb_admin",
			CLOUDBEAVER_ADMIN_PASSWORD: "CbPassword1",
			CLOUDBEAVER_MAPPED_HOST_IP: "10.0.0.1",
			CLOUDBEAVER_MAPPED_PORT: "8080",
			CLOUDBEAVER_SERVER_NAME: "Custom CB",
			CLOUDBEAVER_SERVER_URL: "http://custom-cb:8978",

			// postgresSetup prompts
			useDefaultPostgres: false,
			POSTGRES_DB: "custom-db",
			POSTGRES_MAPPED_HOST_IP: "127.0.0.1",
			POSTGRES_MAPPED_PORT: "5433",
			POSTGRES_PASSWORD: "password",
			POSTGRES_USER: "custom-user",

			// caddySetup prompts
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
			configureEmail: false,
			setupOAuth: false,
			setupMetrics: false,
		};

		const promptMock = vi.spyOn(inquirer, "prompt");

		// Mock implementation filters customAnswers based on the questions asked
		promptMock.mockImplementation((async (questions: unknown) => {
			const qs = Array.isArray(questions)
				? (questions as { name?: string }[])
				: [questions as { name?: string }];
			const answers: Record<string, unknown> = {};
			for (const q of qs) {
				if (q.name && q.name in customAnswers) {
					answers[q.name] = customAnswers[q.name];
				}
			}
			return answers;
		}) as unknown as typeof inquirer.prompt);

		await setup();

		// Verify process.env was updated
		expect(process.env.API_PORT).toBe("5000");
		expect(process.env.API_HOST).toBe("127.0.0.1");
		expect(process.env.API_MINIO_END_POINT).toBe("custom-minio");
		expect(process.env.API_POSTGRES_HOST).toBe("custom-postgres");
	});
});
