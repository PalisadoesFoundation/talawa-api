vi.mock("inquirer");

import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { postgresSetup } from "scripts/setup/services/postgresSetup";
import { setup } from "scripts/setup/setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Setup -> postgresSetup", () => {
	const originalEnv = { ...process.env };
	const originalIsTTY = process.stdin?.isTTY;

	afterEach(() => {
		process.env = { ...originalEnv };
		if (process.stdin) {
			process.stdin.isTTY = originalIsTTY;
		}
		vi.resetAllMocks();
	});

	// Ensure tests are non-interactive to skip shouldBackup prompt
	beforeEach(() => {
		if (process.stdin) {
			process.stdin.isTTY = false;
		}
		// Mock fs.promises.access to simulate .env existence
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
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
			{ envReconfigure: true },
			{ CI: "false" },
			{ useDefaultApi: true },
			{ useDefaultMinio: true },
			{ useDefaultCloudbeaver: true },
			{ useDefaultPostgres: false },
			{ POSTGRES_DB: "customDatabase" },
			{ POSTGRES_MAPPED_HOST_IP: "1.2.3.4" },
			{ POSTGRES_MAPPED_PORT: "5433" },
			{ POSTGRES_PASSWORD: "myPassword" },
			{ POSTGRES_USER: "myUser" },
			{ useDefaultCaddy: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@postgres.com" },
			{ setupReCaptcha: false },
			{ configureEmail: false },
			{ setupOAuth: false },
			{ setupObservability: false },
			{ setupMetrics: false },
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

	it("should sync API_POSTGRES_PASSWORD when POSTGRES_PASSWORD is changed", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ POSTGRES_DB: "talawa" })
			// POSTGRES_PASSWORD changed to "new-password"
			.mockResolvedValueOnce({ POSTGRES_PASSWORD: "new-password" })
			.mockResolvedValueOnce({ POSTGRES_USER: "talawa" });

		// Initial answers with mismatched API_POSTGRES_PASSWORD
		// biome-ignore lint/suspicious/noExplicitAny: Partial answers for testing
		const answers: any = {
			CI: "true",
			API_POSTGRES_PASSWORD: "old-password",
		};

		await postgresSetup(answers);

		expect(answers.POSTGRES_PASSWORD).toBe("new-password");
		// API password should be updated to match
		expect(answers.API_POSTGRES_PASSWORD).toBe("new-password");
	});

	it("should not change API_POSTGRES_PASSWORD if POSTGRES_PASSWORD matches", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ POSTGRES_DB: "talawa" })
			.mockResolvedValueOnce({ POSTGRES_PASSWORD: "password" })
			.mockResolvedValueOnce({ POSTGRES_USER: "talawa" });

		// biome-ignore lint/suspicious/noExplicitAny: Partial answers for testing
		const answers: any = {
			CI: "true",
			API_POSTGRES_PASSWORD: "password",
		};

		await postgresSetup(answers);

		expect(answers.API_POSTGRES_PASSWORD).toBe("password");
	});

	it("should initialize API_POSTGRES_PASSWORD when undefined", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ POSTGRES_DB: "talawa" })
			.mockResolvedValueOnce({ POSTGRES_PASSWORD: "SecurePass456!" })
			.mockResolvedValueOnce({ POSTGRES_USER: "talawa" });

		// biome-ignore lint/suspicious/noExplicitAny: Partial answers for testing
		const answers: any = {
			CI: "true",
			// API_POSTGRES_PASSWORD is undefined
		};

		await postgresSetup(answers);

		// Both should be set to the same value
		expect(answers.POSTGRES_PASSWORD).toBe("SecurePass456!");
		expect(answers.API_POSTGRES_PASSWORD).toBe("SecurePass456!");
		expect(process.env.POSTGRES_PASSWORD).toBe("SecurePass456!");
	});

	it("should handle prompt errors correctly", async () => {
		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		await expect(postgresSetup({})).rejects.toThrow("Prompt failed");
	});
});
