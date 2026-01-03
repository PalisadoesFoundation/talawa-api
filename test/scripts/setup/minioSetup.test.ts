import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";

vi.mock("inquirer");

import fs from "node:fs";
import inquirer from "inquirer";
import { minioSetup } from "scripts/setup/setup";

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
		// Test the minioSetup function directly instead of the full setup flow
		const mockAnswers = { CI: "false" };

		vi.spyOn(inquirer, "prompt")
			.mockResolvedValueOnce({ MINIO_BROWSER: "on" })
			.mockResolvedValueOnce({ MINIO_API_MAPPED_HOST_IP: "1.2.3.4" })
			.mockResolvedValueOnce({ MINIO_API_MAPPED_PORT: "9000" })
			.mockResolvedValueOnce({ MINIO_CONSOLE_MAPPED_HOST_IP: "1.2.3.5" })
			.mockResolvedValueOnce({ MINIO_CONSOLE_MAPPED_PORT: "9001" })
			.mockResolvedValueOnce({ MINIO_ROOT_PASSWORD: "mocked-password" })
			.mockResolvedValueOnce({ MINIO_ROOT_USER: "mocked-user" });

		const result = await minioSetup(mockAnswers);

		expect(result.MINIO_BROWSER).toBe("on");
		expect(result.MINIO_API_MAPPED_HOST_IP).toBe("1.2.3.4");
		expect(result.MINIO_CONSOLE_MAPPED_HOST_IP).toBe("1.2.3.5");
		expect(result.MINIO_CONSOLE_MAPPED_PORT).toBe("9001");
		expect(result.MINIO_ROOT_PASSWORD).toBe("mocked-password");
		expect(result.MINIO_ROOT_USER).toBe("mocked-user");
	});
}, 120000); // Add 120 second timeout
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
		.mockResolvedValueOnce({ MINIO_ROOT_USER: "talawa" })
		.mockResolvedValueOnce({ MINIO_ROOT_PASSWORD: "password" });

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

	await minioSetup({});

	expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
	expect(fsCopyFileSyncSpy).toHaveBeenCalledWith(
		".backup/.env.1700000000",
		".env",
	);
	expect(processExitSpy).toHaveBeenCalledWith(1);

	vi.clearAllMocks();
});
