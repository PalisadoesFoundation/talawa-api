import dotenv from "dotenv";
import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { minioSetup, setup } from "~/src/setup/setup";

vi.mock("inquirer");

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
			{ API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "test@email.com" },
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
	it("should detect port conflicts between API and Console ports", async () => {
		const inputAnswers = { CI: "false" };

		const mockResponses = [
			{ MINIO_BROWSER: "on" },
			{ MINIO_API_MAPPED_HOST_IP: "127.0.0.1" },
			{ MINIO_API_MAPPED_PORT: "9000" },
			{ MINIO_CONSOLE_MAPPED_HOST_IP: "127.0.0.1" },
			{ MINIO_CONSOLE_MAPPED_PORT: "9000" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		await expect(minioSetup(inputAnswers)).rejects.toThrow(
			"Port conflict detected: MinIO API and Console ports must be different",
		);
	});
});
