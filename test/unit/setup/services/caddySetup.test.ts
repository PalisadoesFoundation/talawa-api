vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput
const mockPromptInput = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
}));

describe("Setup -> caddySetup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should configure all Caddy settings", async () => {
		const { caddySetup } = await import("scripts/setup/services/caddySetup");
		const answers: SetupAnswers = {};

		mockPromptInput
			.mockResolvedValueOnce("80") // CADDY_HTTP_MAPPED_PORT
			.mockResolvedValueOnce("443") // CADDY_HTTPS_MAPPED_PORT
			.mockResolvedValueOnce("443") // CADDY_HTTP3_MAPPED_PORT
			.mockResolvedValueOnce("localhost") // CADDY_TALAWA_API_DOMAIN_NAME
			.mockResolvedValueOnce("talawa@email.com") // CADDY_TALAWA_API_EMAIL
			.mockResolvedValueOnce("api") // CADDY_TALAWA_API_HOST
			.mockResolvedValueOnce("4000"); // CADDY_TALAWA_API_PORT

		await caddySetup(answers);

		expect(answers.CADDY_HTTP_MAPPED_PORT).toBe("80");
		expect(answers.CADDY_HTTPS_MAPPED_PORT).toBe("443");
		expect(answers.CADDY_HTTP3_MAPPED_PORT).toBe("443");
		expect(answers.CADDY_TALAWA_API_DOMAIN_NAME).toBe("localhost");
		expect(answers.CADDY_TALAWA_API_EMAIL).toBe("talawa@email.com");
		expect(answers.CADDY_TALAWA_API_HOST).toBe("api");
		expect(answers.CADDY_TALAWA_API_PORT).toBe("4000");
	});

	it("should handle prompt errors", async () => {
		const { caddySetup } = await import("scripts/setup/services/caddySetup");
		const answers: SetupAnswers = {};

		mockPromptInput.mockRejectedValue(new Error("User cancelled"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(caddySetup(answers)).rejects.toThrow();

		consoleErrorSpy.mockRestore();
	});
});
