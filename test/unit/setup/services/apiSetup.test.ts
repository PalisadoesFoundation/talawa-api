vi.mock("inquirer");

import type { SetupAnswers } from "scripts/setup/services/sharedSetup";
import { validatePort, validateURL } from "scripts/setup/validators";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock promptInput and promptList
const mockPromptInput = vi.fn();
const mockPromptList = vi.fn();
vi.mock("scripts/setup/promptHelpers", () => ({
	promptInput: (...args: unknown[]) => mockPromptInput(...args),
	promptList: (...args: unknown[]) => mockPromptList(...args),
}));

// Mock generateJwtSecret only (validators will use real implementations)
const mockGenerateJwtSecret = vi.fn();
vi.mock("scripts/setup/validators", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("scripts/setup/validators")>();
	return {
		...actual,
		generateJwtSecret: () => mockGenerateJwtSecret(),
	};
});

describe("Setup -> apiSetup -> Main Flow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset environment variables
		delete process.env.MINIO_ROOT_PASSWORD;
		delete process.env.POSTGRES_PASSWORD;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Happy Path - All Prompts", () => {
		it("should prompt for all API configuration values and populate answers", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "false" };

			// Mock generated secrets
			const jwtSecret = "a".repeat(128);
			const emailSecret = "b".repeat(32);
			mockGenerateJwtSecret
				.mockReturnValueOnce(jwtSecret)
				.mockReturnValueOnce(emailSecret);

			// Mock all prompts using name-based mocking
			mockPromptInput.mockImplementation((name: string) => {
				const responses: Record<string, string> = {
					API_BASE_URL: "http://localhost:4000",
					API_HOST: "0.0.0.0",
					API_PORT: "4000",
					API_JWT_EXPIRES_IN: "2592000000",
					API_JWT_SECRET: jwtSecret,
					API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS: "86400",
					API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET: emailSecret,
					API_MINIO_ACCESS_KEY: "talawa",
					API_MINIO_END_POINT: "minio",
					API_MINIO_PORT: "9000",
					API_MINIO_SECRET_KEY: "minio_password",
					API_MINIO_TEST_END_POINT: "minio-test",
					API_POSTGRES_DATABASE: "talawa",
					API_POSTGRES_HOST: "postgres",
					API_POSTGRES_PASSWORD: "postgres_password",
					API_POSTGRES_PORT: "5432",
					API_POSTGRES_TEST_HOST: "postgres-test",
					API_POSTGRES_USER: "talawa",
				};
				return Promise.resolve(responses[name] || "default");
			});

			mockPromptList.mockImplementation((name: string) => {
				const responses: Record<string, string> = {
					API_IS_APPLY_DRIZZLE_MIGRATIONS: "true",
					API_IS_GRAPHIQL: "true",
					API_IS_PINO_PRETTY: "true",
					API_LOG_LEVEL: "debug",
					API_MINIO_USE_SSL: "false",
					API_POSTGRES_SSL_MODE: "false",
				};
				return Promise.resolve(responses[name] || "false");
			});

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify all answers are populated
			expect(answers.API_BASE_URL).toBe("http://localhost:4000");
			expect(answers.API_HOST).toBe("0.0.0.0");
			expect(answers.API_PORT).toBe("4000");
			expect(answers.API_IS_APPLY_DRIZZLE_MIGRATIONS).toBe("true");
			expect(answers.API_IS_GRAPHIQL).toBe("true");
			expect(answers.API_IS_PINO_PRETTY).toBe("true");
			expect(answers.API_JWT_EXPIRES_IN).toBe("2592000000");
			expect(answers.API_JWT_SECRET).toBe(jwtSecret);
			expect(answers.API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS).toBe(
				"86400",
			);
			expect(answers.API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET).toBe(
				emailSecret,
			);
			expect(answers.API_LOG_LEVEL).toBe("debug");
			expect(answers.API_MINIO_ACCESS_KEY).toBe("talawa");
			expect(answers.API_MINIO_END_POINT).toBe("minio");
			expect(answers.API_MINIO_PORT).toBe("9000");
			expect(answers.API_MINIO_SECRET_KEY).toBe("minio_password");
			expect(answers.API_MINIO_TEST_END_POINT).toBe("minio-test");
			expect(answers.API_MINIO_USE_SSL).toBe("false");
			expect(answers.API_POSTGRES_DATABASE).toBe("talawa");
			expect(answers.API_POSTGRES_HOST).toBe("postgres");
			expect(answers.API_POSTGRES_PASSWORD).toBe("postgres_password");
			expect(answers.API_POSTGRES_PORT).toBe("5432");
			expect(answers.API_POSTGRES_SSL_MODE).toBe("false");
			expect(answers.API_POSTGRES_TEST_HOST).toBe("postgres-test");
			expect(answers.API_POSTGRES_USER).toBe("talawa");

			// Verify password sync messages
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"MINIO_ROOT_PASSWORD will be set to match API_MINIO_SECRET_KEY",
				),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"POSTGRES_PASSWORD will be set to match API_POSTGRES_PASSWORD",
				),
			);

			consoleLogSpy.mockRestore();
		});
	});

	describe("Validation Tests", () => {
		it("should call validateURL for API_BASE_URL", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("false");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify validateURL was passed as the validator
			expect(mockPromptInput).toHaveBeenCalledWith(
				"API_BASE_URL",
				"API base URL:",
				"http://127.0.0.1:4000",
				validateURL,
			);

			consoleLogSpy.mockRestore();
		});

		it("should call validatePort for API_PORT, API_MINIO_PORT, and API_POSTGRES_PORT", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("false");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify validatePort was passed as the validator for all port prompts
			expect(mockPromptInput).toHaveBeenCalledWith(
				"API_PORT",
				"API port:",
				"4000",
				validatePort,
			);
			expect(mockPromptInput).toHaveBeenCalledWith(
				"API_MINIO_PORT",
				"Minio port:",
				"9000",
				validatePort,
			);
			expect(mockPromptInput).toHaveBeenCalledWith(
				"API_POSTGRES_PORT",
				"Postgres port:",
				"5432",
				validatePort,
			);

			consoleLogSpy.mockRestore();
		});

		it("should validate API_JWT_EXPIRES_IN is a positive integer", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptList.mockResolvedValue("false");

			// Capture the validator function passed to promptInput for JWT_EXPIRES_IN
			let jwtExpiresValidator: ((input: string) => string | true) | undefined;
			mockPromptInput.mockImplementation(
				(name: string, _msg, _def, validator) => {
					if (name === "API_JWT_EXPIRES_IN") {
						jwtExpiresValidator = validator as (input: string) => string | true;
					}
					return Promise.resolve("value");
				},
			);

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Test the validator
			expect(jwtExpiresValidator).toBeDefined();
			if (jwtExpiresValidator) {
				expect(jwtExpiresValidator("2592000000")).toBe(true);
				expect(jwtExpiresValidator("1")).toBe(true);
				expect(jwtExpiresValidator("0")).toBe(
					"JWT expiration must be a positive integer.",
				);
				expect(jwtExpiresValidator("-100")).toBe(
					"JWT expiration must be a positive integer.",
				);
				expect(jwtExpiresValidator("abc")).toBe(
					"JWT expiration must be a positive integer.",
				);
			}

			consoleLogSpy.mockRestore();
		});

		it("should validate API_JWT_SECRET is at least 128 characters", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptList.mockResolvedValue("false");

			// Capture the validator function
			let jwtSecretValidator: ((input: string) => string | true) | undefined;
			mockPromptInput.mockImplementation(
				(name: string, _msg, _def, validator) => {
					if (name === "API_JWT_SECRET") {
						jwtSecretValidator = validator as (input: string) => string | true;
					}
					return Promise.resolve("value");
				},
			);

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Test the validator
			expect(jwtSecretValidator).toBeDefined();
			if (jwtSecretValidator) {
				expect(jwtSecretValidator("a".repeat(128))).toBe(true);
				expect(jwtSecretValidator("a".repeat(200))).toBe(true);
				expect(jwtSecretValidator("a".repeat(127))).toBe(
					"JWT secret must be at least 128 characters long.",
				);
				expect(jwtSecretValidator("short")).toBe(
					"JWT secret must be at least 128 characters long.",
				);
			}

			consoleLogSpy.mockRestore();
		});

		it("should validate API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS is >= 60", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptList.mockResolvedValue("false");

			// Capture the validator function
			let tokenExpiresValidator: ((input: string) => string | true) | undefined;
			mockPromptInput.mockImplementation(
				(name: string, _msg, _def, validator) => {
					if (name === "API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS") {
						tokenExpiresValidator = validator as (
							input: string,
						) => string | true;
					}
					return Promise.resolve("value");
				},
			);

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Test the validator
			expect(tokenExpiresValidator).toBeDefined();
			if (tokenExpiresValidator) {
				expect(tokenExpiresValidator("60")).toBe(true);
				expect(tokenExpiresValidator("86400")).toBe(true);
				expect(tokenExpiresValidator("999999")).toBe(true);
				expect(tokenExpiresValidator("59")).toBe(
					"Expiration must be at least 60 seconds.",
				);
				expect(tokenExpiresValidator("0")).toBe(
					"Expiration must be at least 60 seconds.",
				);
				expect(tokenExpiresValidator("abc")).toBe(
					"Expiration must be at least 60 seconds.",
				);
			}

			consoleLogSpy.mockRestore();
		});

		it("should validate API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET is at least 32 characters", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptList.mockResolvedValue("false");

			// Capture the validator function
			let hmacSecretValidator: ((input: string) => string | true) | undefined;
			mockPromptInput.mockImplementation(
				(name: string, _msg, _def, validator) => {
					if (name === "API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET") {
						hmacSecretValidator = validator as (input: string) => string | true;
					}
					return Promise.resolve("value");
				},
			);

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Test the validator
			expect(hmacSecretValidator).toBeDefined();
			if (hmacSecretValidator) {
				expect(hmacSecretValidator("a".repeat(32))).toBe(true);
				expect(hmacSecretValidator("a".repeat(100))).toBe(true);
				expect(hmacSecretValidator("a".repeat(31))).toBe(
					"HMAC secret must be at least 32 characters long.",
				);
				expect(hmacSecretValidator("short")).toBe(
					"HMAC secret must be at least 32 characters long.",
				);
			}

			consoleLogSpy.mockRestore();
		});
	});

	describe("CI-based Conditional Defaults", () => {
		it("should use 'true' defaults for GraphiQL and Pino Pretty when CI is false", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "false" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("captured");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify GraphiQL default
			expect(mockPromptList).toHaveBeenCalledWith(
				"API_IS_GRAPHIQL",
				"Enable GraphQL?",
				["true", "false"],
				"true",
			);

			// Verify Pino Pretty default
			expect(mockPromptList).toHaveBeenCalledWith(
				"API_IS_PINO_PRETTY",
				"Enable Pino Pretty logs?",
				["true", "false"],
				"true",
			);

			consoleLogSpy.mockRestore();
		});

		it("should use 'false' defaults for GraphiQL and Pino Pretty when CI is true", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("captured");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify GraphiQL default
			expect(mockPromptList).toHaveBeenCalledWith(
				"API_IS_GRAPHIQL",
				"Enable GraphQL?",
				["true", "false"],
				"false",
			);

			// Verify Pino Pretty default
			expect(mockPromptList).toHaveBeenCalledWith(
				"API_IS_PINO_PRETTY",
				"Enable Pino Pretty logs?",
				["true", "false"],
				"false",
			);

			consoleLogSpy.mockRestore();
		});

		it("should use 'debug' log level when CI is false", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "false" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("captured");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify log level default
			expect(mockPromptList).toHaveBeenCalledWith(
				"API_LOG_LEVEL",
				"Log level:",
				["info", "debug"],
				"debug",
			);

			consoleLogSpy.mockRestore();
		});

		it("should use 'info' log level when CI is true", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			mockGenerateJwtSecret.mockReturnValue("a".repeat(128));
			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("captured");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify log level default
			expect(mockPromptList).toHaveBeenCalledWith(
				"API_LOG_LEVEL",
				"Log level:",
				["info", "debug"],
				"info",
			);

			consoleLogSpy.mockRestore();
		});
	});

	describe("Error Handling", () => {
		it("should handle prompt errors for non-password prompts", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			// Mock first prompt to fail
			mockPromptInput.mockRejectedValueOnce(new Error("User cancelled"));

			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await expect(apiSetup(answers)).rejects.toThrow();

			expect(consoleErrorSpy).toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
		});
	});

	describe("Generated Secrets", () => {
		it("should generate JWT secret and email secret and use them as defaults", async () => {
			const { apiSetup } = await import("scripts/setup/services/apiSetup");
			const answers: SetupAnswers = { CI: "true" };

			const generatedJwtSecret = "x".repeat(128);
			const generatedEmailSecret = "y".repeat(32);
			mockGenerateJwtSecret
				.mockReturnValueOnce(generatedJwtSecret)
				.mockReturnValueOnce(generatedEmailSecret);

			mockPromptInput.mockResolvedValue("value");
			mockPromptList.mockResolvedValue("false");

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await apiSetup(answers);

			// Verify generateJwtSecret was called twice
			expect(mockGenerateJwtSecret).toHaveBeenCalledTimes(2);

			// Verify the generated secrets were used as defaults
			expect(mockPromptInput).toHaveBeenCalledWith(
				"API_JWT_SECRET",
				"JWT secret:",
				generatedJwtSecret,
				expect.any(Function),
			);

			expect(mockPromptInput).toHaveBeenCalledWith(
				"API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET",
				"Email verification HMAC secret:",
				generatedEmailSecret,
				expect.any(Function),
			);

			consoleLogSpy.mockRestore();
		});
	});
});
