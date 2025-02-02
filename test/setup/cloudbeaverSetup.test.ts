import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cloudbeaverSetup } from "~/src/setup/setup";

vi.mock("inquirer");

describe("Setup -> cloudbeaverSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for CloudBeaver configuration and update process.env", async () => {
		const mockResponses = [
			{ CLOUDBEAVER_ADMIN_NAME: "mocked-admin" },
			{ CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password" },
			{ CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1" },
			{ CLOUDBEAVER_MAPPED_PORT: "8080" },
			{ CLOUDBEAVER_SERVER_NAME: "Mocked Server" },
			{ CLOUDBEAVER_SERVER_URL: "http://127.0.0.1:8080" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");

		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const answers = await cloudbeaverSetup();

		const expectedEnv = {
			CLOUDBEAVER_ADMIN_NAME: "mocked-admin",
			CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password",
			CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1",
			CLOUDBEAVER_MAPPED_PORT: "8080",
			CLOUDBEAVER_SERVER_NAME: "Mocked Server",
			CLOUDBEAVER_SERVER_URL: "http://127.0.0.1:8080",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});
});
