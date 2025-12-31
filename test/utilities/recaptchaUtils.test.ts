import { beforeEach, describe, expect, test, vi } from "vitest";
import { validateRecaptchaIfRequired } from "../../src/utilities/recaptchaUtils";

const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

describe("validateRecaptchaIfRequired", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns true when Google reCaptcha verification is successful", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		} as Response);
		const result = await validateRecaptchaIfRequired(
			"valid-token",
			"secret-key",
			["input", "recaptchaToken"],
		);
		expect(result).toBe(true);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://www.google.com/recaptcha/api/siteverify",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			}),
		);
	});

	test("throws TalawaGraphQLError when Google reCaptcha verification fails", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: false }),
		} as Response);
		const result = validateRecaptchaIfRequired("valid-token", "secret-key", [
			"input",
			"recaptchaToken",
		]);
		await expect(result).rejects.toMatchObject({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath: ["input", "recaptchaToken"],
						message: "Invalid reCAPTCHA token.",
					},
				],
			},
		});
	});

	test("throws error when HTTP request fails", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
		} as Response);
		const result = validateRecaptchaIfRequired("valid-token", "secret-key", [
			"input",
			"recaptchaToken",
		]);
		await expect(result).rejects.toMatchObject({
			message: "Something went wrong. Please try again later.",
		});
	});

	test("throws TalawaGraphQLError when recaptchaToken is missing but secret key is configured", async () => {
		const result = validateRecaptchaIfRequired(undefined, "secret-key", [
			"input",
			"recaptchaToken",
		]);
		await expect(result).rejects.toMatchObject({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath: ["input", "recaptchaToken"],
						message: "reCAPTCHA token is required.",
					},
				],
			},
		});
	});

	test("If no secret key is configured, skip reCAPTCHA verification", async () => {
		const result = await validateRecaptchaIfRequired("some-token", undefined, [
			"input",
			"recaptchaToken",
		]);
		expect(result).toBeUndefined();
	});
});
