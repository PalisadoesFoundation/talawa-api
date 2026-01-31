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

import inquirer from "inquirer";
import {
	cloudbeaverSetup,
	setup,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
} from "scripts/setup/setup";

describe("Setup -> cloudbeaverSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for CloudBeaver configuration and update process.env", async () => {
		accessMock.mockResolvedValue(undefined);
		const allAnswers = {
			envReconfigure: true,
			shouldBackup: true,
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultCloudbeaver: false,
			CLOUDBEAVER_ADMIN_NAME: "mocked-admin",
			CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password",
			CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1",
			CLOUDBEAVER_MAPPED_PORT: "8080",
			CLOUDBEAVER_SERVER_NAME: "Mocked Server",
			CLOUDBEAVER_SERVER_URL: "https://127.0.0.1:8080",
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

		const answers = await setup();

		const expectedEnv = {
			CLOUDBEAVER_ADMIN_NAME: "mocked-admin",
			CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password",
			CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1",
			CLOUDBEAVER_MAPPED_PORT: "8080",
			CLOUDBEAVER_SERVER_NAME: "Mocked Server",
			CLOUDBEAVER_SERVER_URL: "https://127.0.0.1:8080",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
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
		] as string[]);
		copyFileMock.mockResolvedValue(undefined);
		renameMock.mockResolvedValue(undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await cloudbeaverSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});

describe("CloudBeaver Validation", () => {
	describe("validateCloudBeaverAdmin", () => {
		it("should validate admin name format", () => {
			expect(validateCloudBeaverAdmin("")).toBe("Admin name is required");
			expect(validateCloudBeaverAdmin("ab")).toBe(
				"Admin name must be at least 3 characters long",
			);
			expect(validateCloudBeaverAdmin("admin@123")).toBe(
				"Admin name can only contain letters, numbers, and underscores",
			);
			expect(validateCloudBeaverAdmin("admin_123")).toBe(true);
		});
	});

	describe("validateCloudBeaverPassword", () => {
		it("should validate password strength", () => {
			expect(validateCloudBeaverPassword("")).toBe("Password is required");
			expect(validateCloudBeaverPassword("weak")).toBe(
				"Password must be at least 8 characters long",
			);
			expect(validateCloudBeaverPassword("onlyletters")).toBe(
				"Password must contain both letters and numbers",
			);
			expect(validateCloudBeaverPassword("12345678")).toBe(
				"Password must contain both letters and numbers",
			);
			expect(validateCloudBeaverPassword("Strong2024")).toBe(true);
		});
	});

	describe("validateCloudBeaverURL", () => {
		it("should validate server URL format", () => {
			expect(validateCloudBeaverURL("")).toBe("Server URL is required");
			expect(validateCloudBeaverURL("invalid")).toBe("Invalid URL format");
			expect(validateCloudBeaverURL("ftp://127.0.0.1")).toBe(
				"URL must use HTTP or HTTPS protocol",
			);
			expect(validateCloudBeaverURL("http://127.0.0.1:99999")).toBe(
				"Invalid port in URL",
			);
			expect(validateCloudBeaverURL("http://127.0.0.1:8978")).toBe(true);
			expect(validateCloudBeaverURL("https://localhost:8978")).toBe(true);
		});
	});
});
