import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";

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
import path from "node:path";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { minioSetup, setup } from "scripts/setup/setup";

describe("Setup -> minioSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Minio configuration and update process.env", async () => {
		const mockResponses = [
			{ MINIO_BROWSER: "off" },
			{ MINIO_ROOT_PASSWORD: "mocked-password" },
			{ MINIO_ROOT_USER: "mocked-user" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");

		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const answers = await minioSetup({});

		const expectedEnv = {
			MINIO_BROWSER: "off",
			MINIO_ROOT_PASSWORD: "mocked-password",
			MINIO_ROOT_USER: "mocked-user",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});

	it("should prompt extended Minio config fields when CI=false", async () => {
		accessMock.mockResolvedValue(undefined);
		const allAnswers = {
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: false,
			MINIO_BROWSER: "on",
			MINIO_API_MAPPED_HOST_IP: "1.2.3.4",
			MINIO_API_MAPPED_PORT: "9000",
			MINIO_CONSOLE_MAPPED_HOST_IP: "1.2.3.5",
			MINIO_CONSOLE_MAPPED_PORT: "9001",
			MINIO_ROOT_PASSWORD: "mocked-password",
			MINIO_ROOT_USER: "mocked-user",
			useDefaultCloudbeaver: true,
			useDefaultPostgres: true,
			useDefaultCaddy: true,
			setupReCaptcha: false,
			configureEmail: false,
			setupOAuth: false,
			setupMetrics: false,
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com",
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
			MINIO_BROWSER: "on",
			MINIO_API_MAPPED_HOST_IP: "1.2.3.4",
			MINIO_CONSOLE_MAPPED_HOST_IP: "1.2.3.5",
			MINIO_CONSOLE_MAPPED_PORT: "9001",
			MINIO_ROOT_PASSWORD: "mocked-password",
			MINIO_ROOT_USER: "mocked-user",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(process.env[key]).toBe(value);
		}
	});
	it("should handle port conflict between API and Console ports by prompting for a new port", async () => {
		process.env.CI = "false";

		const promptMock = vi.spyOn(inquirer, "prompt");

		promptMock
			.mockResolvedValueOnce({ MINIO_BROWSER: "on" })
			.mockResolvedValueOnce({ MINIO_API_MAPPED_HOST_IP: "127.0.0.1" })
			.mockResolvedValueOnce({ MINIO_API_MAPPED_PORT: "9000" })
			.mockResolvedValueOnce({ MINIO_CONSOLE_MAPPED_HOST_IP: "127.0.0.1" })
			.mockResolvedValueOnce({ MINIO_CONSOLE_MAPPED_PORT: "9000" }) // Conflict: same as API port
			// Response for the re-prompt after conflict detection
			.mockResolvedValueOnce({ MINIO_CONSOLE_MAPPED_PORT: "9001" })
			.mockResolvedValueOnce({ MINIO_ROOT_PASSWORD: "password" })
			.mockResolvedValueOnce({ MINIO_ROOT_USER: "talawa" });

		const consoleWarnSpy = vi.spyOn(console, "warn");

		const answers: Record<string, string | boolean> = {
			CI: "false",
			useDefaultMinio: false
		};
		await minioSetup(answers);

		// Verify port conflict was resolved
		expect(answers.MINIO_API_MAPPED_PORT).toBe("9000");
		expect(answers.MINIO_CONSOLE_MAPPED_PORT).toBe("9001");

		// Verify warning message was shown
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️ Port conflict detected: MinIO API and Console ports must be different.",
		);

		// Verify inquirer was called the correct number of times (including the extra prompt)
		expect(promptMock).toHaveBeenCalledTimes(8);
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

		await minioSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
			".backup/.env.1700000000",
			".env.tmp",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
