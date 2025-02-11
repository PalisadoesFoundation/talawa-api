import dotenv from "dotenv";
import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { postgresSetup, setup } from "~/src/setup/setup";

vi.mock("inquirer");

describe("Setup -> postgresSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Postgres configuration and update process.env", async () => {
		const mockResponses = [
			{ POSTGRES_DB: "mocked-db" },
			{ POSTGRES_PASSWORD: "mocked-password" },
			{ POSTGRES_USER: "mocked-user" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const answers = await postgresSetup({});

		const expectedEnv = {
			POSTGRES_DB: "mocked-db",
			POSTGRES_PASSWORD: "mocked-password",
			POSTGRES_USER: "mocked-user",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});

	it("should prompt extended Postgres fields when user chooses custom Postgres (CI=false)", async () => {
		const mockResponses = [
			{ envReconfigure: "true" },
			{ CI: "false" },
			{ useDefaultApi: "true" },
			{ useDefaultMinio: "true" },
			{ useDefaultCloudbeaver: "true" },
			{ useDefaultPostgres: false },
			{ POSTGRES_DB: "customDatabase" },
			{ POSTGRES_MAPPED_HOST_IP: "1.2.3.4" },
			{ POSTGRES_MAPPED_PORT: "5433" },
			{ POSTGRES_PASSWORD: "myPassword" },
			{ POSTGRES_USER: "myUser" },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@postgres.com" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const resp of mockResponses) {
			promptMock.mockResolvedValueOnce(resp);
		}

		await setup();
		dotenv.config({ path: ".env" });

		const expectedEnv = {
			POSTGRES_DB: "customDatabase",
			POSTGRES_MAPPED_HOST_IP: "1.2.3.4",
			POSTGRES_MAPPED_PORT: "5433",
			POSTGRES_PASSWORD: "myPassword",
			POSTGRES_USER: "myUser",
		};
		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(process.env[key]).toBe(value);
		}
	});
});
