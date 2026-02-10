import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	validateRecaptchaIfRequired,
	verifyRecaptchaToken,
} from "../../src/utilities/recaptchaUtils";

const mockFetch = vi.fn<typeof fetch>();

describe("validateRecaptchaIfRequired", () => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("returns true when Google reCaptcha v3 verification is successful", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.9, action: "login" }),
		} as Response);
		const result = await validateRecaptchaIfRequired(
			"valid-token",
			"secret-key",
			["input", "recaptchaToken"],
			"login",
			0.5,
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
						message: "reCAPTCHA verification failed. Please try again.",
					},
				],
			},
		});
	});

	test("throws TalawaGraphQLError when score is too low", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.3, action: "login" }),
		} as Response);
		const result = validateRecaptchaIfRequired(
			"valid-token",
			"secret-key",
			["input", "recaptchaToken"],
			"login",
			0.5,
		);
		await expect(result).rejects.toMatchObject({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath: ["input", "recaptchaToken"],
						message: "reCAPTCHA verification failed. Please try again.",
					},
				],
			},
		});
	});

	test("throws TalawaGraphQLError when action mismatch", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.9, action: "signup" }),
		} as Response);
		const result = validateRecaptchaIfRequired(
			"valid-token",
			"secret-key",
			["input", "recaptchaToken"],
			"login",
			0.5,
		);
		await expect(result).rejects.toMatchObject({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath: ["input", "recaptchaToken"],
						message: "reCAPTCHA verification failed. Please try again.",
					},
				],
			},
		});
	});

	test("throws error when HTTP request fails", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"));
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

describe("verifyRecaptchaToken", () => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("returns success true for valid v3 token with good score", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.9, action: "login" }),
		} as Response);

		const result = await verifyRecaptchaToken(
			"valid-token",
			"secret-key",
			"login",
			0.5,
		);
		expect(result).toEqual({
			success: true,
			score: 0.9,
			action: "login",
		});
	});

	test("returns success false for low score", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.3, action: "login" }),
		} as Response);

		const result = await verifyRecaptchaToken(
			"valid-token",
			"secret-key",
			"login",
			0.5,
		);
		expect(result).toEqual({
			success: false,
			score: 0.3,
			action: "login",
		});
	});

	test("returns success false for action mismatch", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.9, action: "signup" }),
		} as Response);

		const result = await verifyRecaptchaToken(
			"valid-token",
			"secret-key",
			"login",
			0.5,
		);
		expect(result).toEqual({
			success: false,
			score: 0.9,
			action: "signup",
		});
	});

	test("works without action validation", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.9, action: "login" }),
		} as Response);

		const result = await verifyRecaptchaToken(
			"valid-token",
			"secret-key",
			undefined,
			0.5,
		);
		expect(result).toEqual({
			success: true,
			score: 0.9,
			action: "login",
		});
	});

	test("should send success: false when score is missing", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		} as Response);

		const result = await verifyRecaptchaToken("valid-token", "secret-key");
		expect(result).toEqual({
			success: false,
			score: undefined,
			action: undefined,
		});
	});

	test("returns success: false when HTTP returns code other than 2XX", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
		} as Response);
		const result = await verifyRecaptchaToken("valid-token", "secret-key");
		expect(result).toEqual({
			success: false,
			score: undefined,
			action: undefined,
		});
	});

	test("returns success true when score equals threshold exactly", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, score: 0.5, action: "login" }),
		} as Response);

		const result = await verifyRecaptchaToken(
			"valid-token",
			"secret-key",
			"login",
			0.5,
		);
		expect(result).toEqual({
			success: true,
			score: 0.5,
			action: "login",
		});
	});
});
