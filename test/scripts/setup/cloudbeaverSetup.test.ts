import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import fs from "node:fs";
import inquirer from "inquirer";
import { cloudbeaverSetup } from "scripts/setup/services/cloudbeaverSetup";
import { setup } from "scripts/setup/setup";
import {
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
} from "scripts/setup/validators";

describe("Setup -> cloudbeaverSetup", () => {
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

	it("should prompt the user for CloudBeaver configuration and update process.env", async () => {
		const mockResponses = [
			{ envReconfigure: true },
			{ CI: "false" },
			{ useDefaultApi: true },
			{ useDefaultMinio: true },
			{ useDefaultCloudbeaver: false },
			{ CLOUDBEAVER_ADMIN_NAME: "mocked-admin" },
			{ CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password" },
			{ CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1" },
			{ CLOUDBEAVER_MAPPED_PORT: "8080" },
			{ CLOUDBEAVER_SERVER_NAME: "Mocked Server" },
			{ CLOUDBEAVER_SERVER_URL: "https://127.0.0.1:8080" },
			{ useDefaultPostgres: true },
			{ useDefaultCaddy: true },
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
			{ setupReCaptcha: false },
			{ configureEmail: false },
			{ setupOAuth: false },
			{ setupMetrics: false },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");

		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

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
		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		await expect(cloudbeaverSetup({})).rejects.toThrow("Prompt failed");
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
