import inquirer from "inquirer";
import { minioSetup } from "setup";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("Setup -> minioSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Minio configuration and update process.env", async () => {
		const mockedAnswers = {
			MINIO_BROWSER: "off",
			MINIO_API_MAPPED_HOST_IP: "192.168.1.10",
			MINIO_API_MAPPED_PORT: "8000",
			MINIO_CONSOLE_MAPPED_HOST_IP: "192.168.1.20",
			MINIO_CONSOLE_MAPPED_PORT: "8001",
			MINIO_ROOT_PASSWORD: "mocked-password",
			MINIO_ROOT_USER: "mocked-user",
		};

		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(mockedAnswers);

		await minioSetup();

		expect(process.env.MINIO_BROWSER).toBe("off");
		expect(process.env.MINIO_API_MAPPED_HOST_IP).toBe("192.168.1.10");
		expect(process.env.MINIO_API_MAPPED_PORT).toBe("8000");
		expect(process.env.MINIO_CONSOLE_MAPPED_HOST_IP).toBe("192.168.1.20");
		expect(process.env.MINIO_CONSOLE_MAPPED_PORT).toBe("8001");
		expect(process.env.MINIO_ROOT_PASSWORD).toBe("mocked-password");
		expect(process.env.MINIO_ROOT_USER).toBe("mocked-user");
	});
});
