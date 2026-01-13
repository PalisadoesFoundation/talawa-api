vi.mock("inquirer");

import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { postgresSetup, setup } from "scripts/setup/setup";
import { afterEach, describe, expect, it, vi } from "vitest";

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

		const promptMock = (vi.spyOn(inquirer, "prompt") as any) as any;
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
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
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
		];

		const promptMock = (vi.spyOn(inquirer, "prompt") as any);
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

	it("should handle prompt errors correctly", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);

		// Mock fs.promises methods used in restoreLatestBackup
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "readdir").mockResolvedValue([
			".env.1600000000",
			".env.1700000000",
		] as any);
		const fsCopyFileSpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "rename").mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		(vi.spyOn(inquirer, "prompt") as any).mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await postgresSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env.tmp",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
