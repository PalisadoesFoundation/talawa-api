import { afterEach, describe, expect, it, vi } from "vitest";

const {
	accessMock,
	readdirMock,
	copyFileMock,
	renameMock,
	readFileMock,
	writeFileMock,
} = vi.hoisted(() => ({
	accessMock: vi.fn(),
	readdirMock: vi.fn(),
	copyFileMock: vi.fn(),
	renameMock: vi.fn(),
	readFileMock: vi.fn(),
	writeFileMock: vi.fn(),
}));

vi.mock("inquirer");

vi.mock("scripts/setup/envFileBackup/envFileBackup", () => ({
	envFileBackup: vi.fn().mockResolvedValue(false),
}));

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	const promises = {
		access: accessMock,
		readdir: readdirMock,
		copyFile: copyFileMock,
		rename: renameMock,
		readFile: readFileMock,
		writeFile: writeFileMock,
	};
	return {
		...actual,
		promises,
		default: {
			...actual,
			promises,
		},
	};
});

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
		readFileMock.mockResolvedValue("CI=false\nAPI_PORT=4000");
		writeFileMock.mockResolvedValue(undefined);
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
		// Mock inquirer.prompt: return answers plus a dummy `ui` to satisfy types
		type PromptQuestion = { name?: string };
		type PromptReturn = Record<string, string | unknown> & { ui: unknown };
		type PromptSpy = {
			mockImplementation: (
				fn: (questions: unknown) => Promise<PromptReturn>,
			) => void;
		};

		(promptMock as unknown as PromptSpy).mockImplementation(
			async (questions: unknown) => {
				const qs = Array.isArray(questions)
					? (questions as unknown[])
					: [questions as unknown];
				const result: Record<string, string> = {};
				for (const q of qs) {
					if (
						typeof q === "object" &&
						q !== null &&
						"name" in (q as PromptQuestion)
					) {
						const name = (q as PromptQuestion).name;
						if (name && name in allAnswers) {
							const val = allAnswers[name as keyof typeof allAnswers];
							result[name] =
								typeof val === "boolean"
									? (val as unknown as string)
									: String(val);
						}
					}
				}
				return { ui: {} as unknown, ...(result as Record<string, string>) };
			},
		);

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

		const answers: Record<string, string | boolean | undefined> = {
			CI: "false",
			useDefaultMinio: false,
		};
		// The setup function expects a Record<string, string> but in tests we pass
		// boolean flags (e.g. useDefaultMinio). We cast via unknown to satisfy
		// TypeScript for test setup only.
		await minioSetup(answers as unknown as Record<string, string>);

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
		] as string[]);
		copyFileMock.mockResolvedValue(undefined);
		renameMock.mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await minioSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
