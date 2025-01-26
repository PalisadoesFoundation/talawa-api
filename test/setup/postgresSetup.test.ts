import inquirer from "inquirer";
import { postgresSetup } from "setup";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("Setup -> postgresSetup", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Postgres configuration and update process.env", async () => {
		const mockedAnswers = {
			POSTGRES_DB: "mocked-db",
			POSTGRES_MAPPED_HOST_IP: "192.168.1.100",
			POSTGRES_MAPPED_PORT: "5434",
			POSTGRES_PASSWORD: "mocked-password",
			POSTGRES_USER: "mocked-user",
		};

		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(mockedAnswers);

		await postgresSetup();

		expect(process.env.POSTGRES_DB).toBe("mocked-db");
		expect(process.env.POSTGRES_MAPPED_HOST_IP).toBe("192.168.1.100");
		expect(process.env.POSTGRES_MAPPED_PORT).toBe("5434");
		expect(process.env.POSTGRES_PASSWORD).toBe("mocked-password");
		expect(process.env.POSTGRES_USER).toBe("mocked-user");
	});
});
