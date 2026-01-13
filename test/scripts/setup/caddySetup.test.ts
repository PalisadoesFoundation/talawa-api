import dotenv from "dotenv";
import inquirer from "inquirer";
import { caddySetup } from "scripts/setup/setup";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("Setup -> caddySetup", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Caddy configuration and update environment variables", async () => {
		const mockResponses = [
			{ CADDY_HTTP_MAPPED_PORT: "801" },
			{ CADDY_HTTPS_MAPPED_PORT: "4431" },
			{ CADDY_HTTP3_MAPPED_PORT: "4431" },
			{ CADDY_TALAWA_API_DOMAIN_NAME: "localhost" },
			{ CADDY_TALAWA_API_EMAIL: "example@talawa.com" },
			{ CADDY_TALAWA_API_HOST: "api" },
			{ CADDY_TALAWA_API_PORT: "3000" },
		];

		const promptMock = (vi.spyOn(inquirer, "prompt") as any) as any;
		for (const resp of mockResponses) {
			promptMock.mockResolvedValueOnce(resp);
		}

		const answers = await caddySetup({});
		dotenv.config({ path: ".env" });

		const expectedEnv = {
			CADDY_HTTP_MAPPED_PORT: "801",
			CADDY_HTTPS_MAPPED_PORT: "4431",
			CADDY_HTTP3_MAPPED_PORT: "4431",
			CADDY_TALAWA_API_DOMAIN_NAME: "localhost",
			CADDY_TALAWA_API_EMAIL: "example@talawa.com",
			CADDY_TALAWA_API_HOST: "api",
			CADDY_TALAWA_API_PORT: "3000",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});
});
