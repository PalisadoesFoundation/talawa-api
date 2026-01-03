import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	validateRecaptchaIfRequired,
	verifyRecaptchaToken,
} from "../../src/utilities/recaptchaUtils";

const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

const mockLogger = {
	error: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	trace: vi.fn(),
	fatal: vi.fn(),
	child: vi.fn(),
} as unknown as FastifyBaseLogger;

describe("recaptchaUtils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("verifyRecaptchaToken", () => {
		test("returns true when verification is successful", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			const result = await verifyRecaptchaToken(
				"valid-token",
				"secret-key",
				mockLogger,
			);
			expect(result).toBe(true);
		});

		test("returns true when verification is successful with logger", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			const result = await verifyRecaptchaToken(
				"valid-token",
				"secret-key",
				mockLogger,
			);
			expect(result).toBe(true);
		});

		test("returns false when verification fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: false }),
			} as Response);

			const result = await verifyRecaptchaToken(
				"invalid-token",
				"secret-key",
				mockLogger,
			);
			expect(result).toBe(false);
		});

		test("logs error and throws TalawaGraphQLError when fetch throws", async () => {
			const networkError = new Error("Network error");
			mockFetch.mockRejectedValueOnce(networkError);

			await expect(
				verifyRecaptchaToken("token", "secret", mockLogger),
			).rejects.toMatchObject({
				extensions: {
					code: "unexpected",
				},
			});

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ err: networkError },
				"reCAPTCHA verification error",
			);
		});
	});

	describe("validateRecaptchaIfRequired", () => {
		test("returns true when Google reCaptcha verification is successful", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);
			const result = await validateRecaptchaIfRequired(
				"valid-token",
				"secret-key",
				["input", "recaptchaToken"],
				mockLogger,
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

		test("returns true when Google reCaptcha verification is successful with logger provided", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);
			const result = await validateRecaptchaIfRequired(
				"valid-token",
				"secret-key",
				["input", "recaptchaToken"],
				mockLogger,
			);
			expect(result).toBe(true);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://www.google.com/recaptcha/api/siteverify",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
				}),
			);
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		test("throws TalawaGraphQLError when Google reCaptcha verification fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: false }),
			} as Response);
			const result = validateRecaptchaIfRequired(
				"valid-token",
				"secret-key",
				["input", "recaptchaToken"],
				mockLogger,
			);
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

		test("throws error when HTTP request fails (malformed response)", async () => {
			// Simulates a response where json() fails (e.g. malformed or partial response)
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				// Missing json method simulates partial failure or just mock object limitation triggering catch
			} as Response);
			const result = validateRecaptchaIfRequired(
				"valid-token",
				"secret-key",
				["input", "recaptchaToken"],
				mockLogger,
			);
			await expect(result).rejects.toMatchObject({
				message: "Something went wrong. Please try again later.",
			});
		});

		test("throws TalawaGraphQLError when recaptchaToken is missing but secret key is configured", async () => {
			const result = validateRecaptchaIfRequired(
				undefined,
				"secret-key",
				["input", "recaptchaToken"],
				mockLogger,
			);
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
			const result = await validateRecaptchaIfRequired(
				"some-token",
				undefined,
				["input", "recaptchaToken"],
				mockLogger,
			);
			expect(result).toBeUndefined();
		});

		test("propagates logger to verifyRecaptchaToken on error", async () => {
			const networkError = new Error("Network error");
			mockFetch.mockRejectedValueOnce(networkError);

			await expect(
				validateRecaptchaIfRequired(
					"token",
					"secret",
					["input", "recaptchaToken"],
					mockLogger,
				),
			).rejects.toThrow();

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ err: networkError },
				"reCAPTCHA verification error",
			);
		});
	});
});
