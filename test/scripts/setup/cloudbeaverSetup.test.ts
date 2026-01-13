import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import fs from "node:fs";
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
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
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
		];

		const promptMock = (vi.spyOn(inquirer, "prompt") as any) as any;

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

		await cloudbeaverSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env.tmp",
		);
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
				"Invalid URL format",
			);
			expect(validateCloudBeaverURL("http://127.0.0.1:8978")).toBe(true);
			expect(validateCloudBeaverURL("https://localhost:8978")).toBe(true);
		});
	});
});
