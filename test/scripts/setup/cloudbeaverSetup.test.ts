import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";

vi.mock("inquirer");

import fs from "node:fs";
import inquirer from "inquirer";
import {
	cloudbeaverSetup,
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
		// Test the cloudbeaverSetup function directly instead of the full setup flow
		const mockAnswers = { CI: "false" };

		vi.spyOn(inquirer, "prompt")
			.mockResolvedValueOnce({ CLOUDBEAVER_ADMIN_NAME: "mocked-admin" })
			.mockResolvedValueOnce({ CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password" })
			.mockResolvedValueOnce({ CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1" })
			.mockResolvedValueOnce({ CLOUDBEAVER_MAPPED_PORT: "8080" })
			.mockResolvedValueOnce({ CLOUDBEAVER_SERVER_NAME: "Mocked Server" })
			.mockResolvedValueOnce({
				CLOUDBEAVER_SERVER_URL: "https://127.0.0.1:8080",
			});

		const result = await cloudbeaverSetup(mockAnswers);

		expect(result.CLOUDBEAVER_ADMIN_NAME).toBe("mocked-admin");
		expect(result.CLOUDBEAVER_ADMIN_PASSWORD).toBe("mocked-password");
		expect(result.CLOUDBEAVER_MAPPED_HOST_IP).toBe("127.0.0.1");
		expect(result.CLOUDBEAVER_MAPPED_PORT).toBe("8080");
		expect(result.CLOUDBEAVER_SERVER_NAME).toBe("Mocked Server");
		expect(result.CLOUDBEAVER_SERVER_URL).toBe("https://127.0.0.1:8080");
	});

	it("should handle prompt errors correctly", async () => {
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path === ".backup") return true;
			return false;
		});
		(
			vi.spyOn(fs, "readdirSync") as unknown as MockInstance<
				(path: fs.PathLike) => string[]
			>
		).mockImplementation(() => [".env.1600000000", ".env.1700000000"]);
		const fsCopyFileSyncSpy = vi
			.spyOn(fs, "copyFileSync")
			.mockImplementation(() => undefined);

		const mockError = new Error("Prompt failed");
		vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockError);

		const consoleErrorSpy = vi.spyOn(console, "error");

		await cloudbeaverSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSyncSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env",
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
