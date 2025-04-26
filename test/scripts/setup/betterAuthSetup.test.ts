import crypto from "node:crypto";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { betterAuthSetup } from "scripts/setup/setup";
import { generateBetterauthSecret } from "scripts/setup/setup";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

describe("Utils -> generateBetterauthSecret", () => {
	it("should generate a valid hex secret string of at least 64 characters", () => {
		const secret = generateBetterauthSecret();
		expect(typeof secret).toBe("string");
		expect(secret.length).toBeGreaterThanOrEqual(64);
		expect(secret).toMatch(/^[a-f0-9]+$/i);
	});

	it("should throw an error if crypto.randomBytes fails", () => {
		const originalRandomBytes = crypto.randomBytes;
		vi.spyOn(crypto, "randomBytes").mockImplementationOnce(() => {
			throw new Error("Permission denied");
		});

		expect(() => generateBetterauthSecret()).toThrowError(
			"Failed to generate Better Auth secret",
		);
		crypto.randomBytes = originalRandomBytes;
	});
});
describe("Setup -> betterAuthSetup", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	it("should prompt the user for Better Auth configuration and update environment variables", async () => {
		const mockResponses = [
			{ BETTER_AUTH_SECRET: "some-secret-key" },
			{ API_CORS_ORIGIN: "http://localhost:4321" },
			{ NODE_ENV: "development" },
		];

		const promptMock = vi.spyOn(inquirer, "prompt");
		for (const resp of mockResponses) {
			promptMock.mockResolvedValueOnce(resp);
		}

		const answers = await betterAuthSetup({});
		dotenv.config({ path: ".env" });

		const expectedEnv = {
			BETTER_AUTH_SECRET: "some-secret-key",
			API_CORS_ORIGIN: "http://localhost:4321",
			NODE_ENV: "development",
		};

		for (const [key, value] of Object.entries(expectedEnv)) {
			expect(answers[key]).toBe(value);
		}
	});
});
