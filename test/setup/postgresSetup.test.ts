import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { postgresSetup } from "~/src/setup/setup";

vi.mock("inquirer");

describe("Setup -> postgresSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Postgres configuration and update process.env", async () => {
		const mockResponses = [
			{ POSTGRES_DB: "mocked-db" },
			{ POSTGRES_PASSWORD: "mocked-password" },
			{ POSTGRES_USER: "mocked-user" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const response of mockResponses) {
			promptMock.mockResolvedValueOnce(response);
		}

		const answers = await postgresSetup();

		const expectedEnv = {
			POSTGRES_DB: "mocked-db",
			POSTGRES_PASSWORD: "mocked-password",
			POSTGRES_USER: "mocked-user",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});
});
