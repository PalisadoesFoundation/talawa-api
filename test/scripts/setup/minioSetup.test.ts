import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import fs from "node:fs";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { minioSetup } from "scripts/setup/services/minioSetup";
import { setup } from "scripts/setup/setup";

describe("Setup -> minioSetup", () => {
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
		const mockResponses = [
			{ envReconfigure: true },
			{ CI: "false" },
			{ useDefaultApi: true },
			{ useDefaultMinio: false },
			{ MINIO_BROWSER: "on" },
			{ MINIO_API_MAPPED_HOST_IP: "1.2.3.4" },
			{ MINIO_API_MAPPED_PORT: "9000" },
			{ MINIO_CONSOLE_MAPPED_HOST_IP: "1.2.3.5" },
			{ MINIO_CONSOLE_MAPPED_PORT: "9001" },
			{ MINIO_ROOT_PASSWORD: "mocked-password" },
			{ MINIO_ROOT_USER: "mocked-user" },
			{ useDefaultCloudbeaver: true },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ setupReCaptcha: false },
			{ configureEmail: false },
			{ setupOAuth: false },
			{ setupObservability: false },
			{ setupMetrics: false },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

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

		const answers: Record<string, string> = { CI: "false" };
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

	it("should sync API_MINIO_SECRET_KEY when MINIO_ROOT_PASSWORD is changed", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ MINIO_BROWSER: "off" })
			// MINIO_ROOT_PASSWORD changed to "new-password"
			.mockResolvedValueOnce({ MINIO_ROOT_PASSWORD: "new-password" })
			.mockResolvedValueOnce({ MINIO_ROOT_USER: "talawa" });

		// Initial answers with mismatched API_MINIO_SECRET_KEY
		// biome-ignore lint/suspicious/noExplicitAny: Partial answers for testing
		const answers: any = {
			CI: "true",
			API_MINIO_SECRET_KEY: "old-password",
		};

		await minioSetup(answers);

		expect(answers.MINIO_ROOT_PASSWORD).toBe("new-password");
		// Secret key should be updated to match
		expect(answers.API_MINIO_SECRET_KEY).toBe("new-password");
	});

	it("should not change API_MINIO_SECRET_KEY if MINIO_ROOT_PASSWORD matches", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");
		const consoleLogSpy = vi.spyOn(console, "log");
		promptMock
			.mockResolvedValueOnce({ MINIO_BROWSER: "off" })
			.mockResolvedValueOnce({ MINIO_ROOT_PASSWORD: "password" })
			.mockResolvedValueOnce({ MINIO_ROOT_USER: "talawa" });

		// biome-ignore lint/suspicious/noExplicitAny: Partial answers for testing
		const answers: any = {
			CI: "true",
			API_MINIO_SECRET_KEY: "password",
		};

		await minioSetup(answers);

		expect(answers.API_MINIO_SECRET_KEY).toBe("password");
		// Verify no-op branch was taken (no sync message logged)
		expect(consoleLogSpy).not.toHaveBeenCalledWith(
			expect.stringContaining("Synchronized"),
		);
	});

	it("should initialize API_MINIO_SECRET_KEY when undefined", async () => {
		const promptMock = vi.spyOn(inquirer, "prompt");
		promptMock
			.mockResolvedValueOnce({ MINIO_BROWSER: "off" })
			.mockResolvedValueOnce({ MINIO_ROOT_PASSWORD: "SecurePass123!" })
			.mockResolvedValueOnce({ MINIO_ROOT_USER: "talawa" });

		// biome-ignore lint/suspicious/noExplicitAny: Partial answers for testing
		const answers: any = {
			CI: "true",
			// API_MINIO_SECRET_KEY is undefined
		};

		await minioSetup(answers);

		// Both should be set to the same value
		expect(answers.MINIO_ROOT_PASSWORD).toBe("SecurePass123!");
		expect(answers.API_MINIO_SECRET_KEY).toBe("SecurePass123!");
		expect(process.env.MINIO_ROOT_PASSWORD).toBe("SecurePass123!");
	});

	it("should handle prompt errors correctly", async () => {
		const promptError = new Error("inquirer failure");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(promptError);

		await expect(minioSetup({})).rejects.toThrow("inquirer failure");
	});
});
