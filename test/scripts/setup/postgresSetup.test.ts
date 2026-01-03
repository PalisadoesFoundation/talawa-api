vi.mock("inquirer");

import fs from "node:fs";
import inquirer from "inquirer";
import { postgresSetup } from "scripts/setup/setup";
import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";

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

		const answers = await postgresSetup({});

		const expectedEnv = {
			POSTGRES_DB: "mocked-db",
			POSTGRES_PASSWORD: "mocked-password",
			POSTGRES_USER: "mocked-user",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});

	it("should prompt extended Postgres fields when user chooses custom Postgres (CI=false)", async () => {
		// Test the postgresSetup function directly instead of the full setup flow
		const mockAnswers = { CI: "false" };

		vi.spyOn(inquirer, "prompt")
			.mockResolvedValueOnce({ POSTGRES_DB: "customDatabase" })
			.mockResolvedValueOnce({ POSTGRES_MAPPED_HOST_IP: "1.2.3.4" })
			.mockResolvedValueOnce({ POSTGRES_MAPPED_PORT: "5433" })
			.mockResolvedValueOnce({ POSTGRES_PASSWORD: "myPassword" })
			.mockResolvedValueOnce({ POSTGRES_USER: "myUser" });

		const result = await postgresSetup(mockAnswers);

		expect(result.POSTGRES_DB).toBe("customDatabase");
		expect(result.POSTGRES_MAPPED_HOST_IP).toBe("1.2.3.4");
		expect(result.POSTGRES_MAPPED_PORT).toBe("5433");
		expect(result.POSTGRES_PASSWORD).toBe("myPassword");
		expect(result.POSTGRES_USER).toBe("myUser");
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

		await postgresSetup({});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
		expect(fsCopyFileSyncSpy).toHaveBeenCalledWith(
			".backup/.env.1700000000",
			".env",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);

		vi.clearAllMocks();
	});
});
