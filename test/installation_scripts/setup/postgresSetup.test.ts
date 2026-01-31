const { accessMock, readdirMock, copyFileMock, renameMock, readFileMock, writeFileMock } = vi.hoisted(() => ({
	accessMock: vi.fn(),
	readdirMock: vi.fn(),
	copyFileMock: vi.fn(),
	renameMock: vi.fn(),
	readFileMock: vi.fn(),
	writeFileMock: vi.fn(),
}));

vi.mock("inquirer");

vi.mock("node:fs", () => {
	const promises = {
		access: accessMock,
		readdir: readdirMock,
		copyFile: copyFileMock,
		rename: renameMock,
		readFile: readFileMock,
		writeFile: writeFileMock,
	};
	return {
		promises,
		default: {
			promises,
		},
	};
});

import { promises as fs } from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { postgresSetup, setup } from "scripts/setup/setup";
import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";

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
		accessMock.mockResolvedValue(undefined);
		const allAnswers = {
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultCloudbeaver: true,
			useDefaultPostgres: false,
			POSTGRES_DB: "customDatabase",
			POSTGRES_MAPPED_HOST_IP: "1.2.3.4",
			POSTGRES_MAPPED_PORT: "5433",
			POSTGRES_PASSWORD: "myPassword",
			POSTGRES_USER: "myUser",
			useDefaultCaddy: true,
			setupReCaptcha: false,
			configureEmail: false,
			setupOAuth: false,
			setupMetrics: false,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@postgres.com",
		};

		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock.mockImplementation((async (questions: any) => {
			const qs = Array.isArray(questions) ? questions : [questions];
			const result: any = {};
			for (const q of qs) {
				if (q.name && q.name in allAnswers) {
					result[q.name] = allAnswers[q.name as keyof typeof allAnswers];
				}
			}
			return result;
		}) as any);

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
		accessMock.mockResolvedValue(undefined);
		readdirMock.mockResolvedValue([
			".env.1600000000",
			".env.1700000000",
		] as any);
		copyFileMock.mockResolvedValue(undefined);
		renameMock.mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await postgresSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
			".env.tmp",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
