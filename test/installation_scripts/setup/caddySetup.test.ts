import dotenv from "dotenv";
import inquirer from "inquirer";
import { caddySetup } from "scripts/setup/setup";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

vi.mock("env-schema", () => ({
	envSchema: () => ({
		API_GRAPHQL_SCALAR_FIELD_COST: 1,
		API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
		API_GRAPHQL_OBJECT_FIELD_COST: 1,
		API_GRAPHQL_LIST_FIELD_COST: 1,
		API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
		API_GRAPHQL_MUTATION_BASE_COST: 1,
		API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
	}),
}));

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

		const promptMock = vi.spyOn(inquirer, "prompt");
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
