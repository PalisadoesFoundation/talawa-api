import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { postgresSetup, setup } from "scripts/setup/setup";
import { afterEach, describe, expect, it, vi } from "vitest";

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

		const answers = await postgresSetup({ CI: "true" });

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
		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		vi.spyOn(fs, "readFileSync").mockReturnValue("");
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
		vi.spyOn(fs, "copyFileSync").mockImplementation(() => undefined);
		vi.spyOn(fs, "unlinkSync").mockImplementation(() => undefined);

		const mockResponses = [
			{ envReconfigure: true },
			{ shouldBackup: false },
			{ CI: "false" },
			{ useDefaultMinio: true },
			{ useDefaultCloudbeaver: true },
			{ useDefaultPostgres: false },
			{ POSTGRES_DB: "customDatabase" },
			{ POSTGRES_MAPPED_HOST_IP: "1.2.3.4" },
			{ POSTGRES_MAPPED_PORT: "5433" },
			{ POSTGRES_PASSWORD: "myPassword" },
			{ POSTGRES_USER: "myUser" },
			{ useDefaultCaddy: true },
			{ useDefaultApi: true },
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

	it("should handle prompt errors correctly", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		const fsExistsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const fsReaddirSyncSpy = vi
			.spyOn(fs, "readdirSync")
			.mockReturnValue([".env.1234567890"] as unknown as ReturnType<
				typeof fs.readdirSync
			>);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");
		const consoleLogSpy = vi.spyOn(console, "log");

		await postgresSetup({ CI: "true" });

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(".backup");
		expect(fsReaddirSyncSpy).toHaveBeenCalledWith(".backup");
		expect(fsCopyFileSyncSpy).toHaveBeenCalledWith(
			".backup/.env.1234567890",
			".env",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"Restoring from latest backup: .backup/.env.1234567890",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
