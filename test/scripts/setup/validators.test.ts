import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import {
	checkEnvFile,
	generateJwtSecret,
	initializeEnvFile,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validateEmail,
	validatePort,
	validateURL,
} from "scripts/setup/setup";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

vi.mock("node:fs");
vi.mock("node:crypto");
vi.mock("node:path", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:path")>();
	return { ...actual };
});
vi.mock("dotenv", () => ({
	default: {
		parse: vi.fn(),
		config: vi.fn(),
	},
}));

describe("Setup Utility Functions", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("generateJwtSecret", () => {
		it("should generate a random secret", () => {
			vi.mocked(crypto.randomBytes).mockImplementation(
				() => Buffer.from("test-secret") as unknown as Buffer,
			);
			const result = generateJwtSecret();
			expect(result).toBe(Buffer.from("test-secret").toString("hex"));
		});

		it("should throw TalawaRestError on failure", () => {
			vi.mocked(crypto.randomBytes).mockImplementation(() => {
				throw new Error("Crypto failed");
			});
			expect(() => generateJwtSecret()).toThrow(TalawaRestError);
			expect(() => generateJwtSecret()).toThrow(
				"Failed to generate JWT secret",
			);
		});
	});

	describe("validateURL", () => {
		it("should return true for valid HTTP/HTTPS URLs", () => {
			// Checking HTTP
			expect(validateURL("http://example.com")).toBe(true);
			// Checking HTTPS
			expect(validateURL("https://example.com")).toBe(true);
		});

		it("should return error message for invalid protocol", () => {
			expect(validateURL("ftp://example.com")).toMatch(
				/valid URL with http:\/\/ or https:\/\//,
			);
		});

		it("should return error message for invalid URL format", () => {
			expect(validateURL("not-a-url")).toBe("Please enter a valid URL.");
		});
	});

	describe("validatePort", () => {
		it("should return true for valid ports", () => {
			expect(validatePort("3000")).toBe(true);
		});

		it("should return error for non-numeric input", () => {
			expect(validatePort("abc")).toContain("valid port number");
		});

		it("should return error for out of range ports", () => {
			expect(validatePort("0")).toContain("valid port number");
			expect(validatePort("70000")).toContain("valid port number");
		});
	});

	describe("validateEmail", () => {
		it("should return true for valid email", () => {
			expect(validateEmail("test@example.com")).toBe(true);
		});

		it("should return error for empty email", () => {
			expect(validateEmail("")).toBe("Email cannot be empty.");
		});

		it("should return error for long email", () => {
			const longEmail = `${"a".repeat(250)}@example.com`;
			expect(validateEmail(longEmail)).toBe("Email is too long.");
		});

		it("should return error for invalid format", () => {
			expect(validateEmail("invalid-email")).toContain("Invalid email format");
		});
	});

	describe("validateCloudBeaverAdmin", () => {
		it("should return true for valid admin name", () => {
			expect(validateCloudBeaverAdmin("admin1")).toBe(true);
		});

		it("should return error for empty name", () => {
			expect(validateCloudBeaverAdmin("")).toContain("required");
		});

		it("should return error for short name", () => {
			expect(validateCloudBeaverAdmin("ab")).toContain("at least 3 characters");
		});

		it("should return error for invalid characters", () => {
			expect(validateCloudBeaverAdmin("admin!")).toContain(
				"letters, numbers, and underscores",
			);
		});
	});

	describe("validateCloudBeaverPassword", () => {
		it("should return true for valid password", () => {
			expect(validateCloudBeaverPassword("password123")).toBe(true);
		});

		it("should return error if empty", () => {
			expect(validateCloudBeaverPassword("")).toContain("required");
		});

		it("should return error if too short", () => {
			expect(validateCloudBeaverPassword("pass")).toContain(
				"at least 8 characters",
			);
		});

		it("should return error if missing numbers or letters", () => {
			expect(validateCloudBeaverPassword("password")).toContain(
				"both letters and numbers",
			);
			expect(validateCloudBeaverPassword("12345678")).toContain(
				"both letters and numbers",
			);
		});
	});

	describe("validateCloudBeaverURL", () => {
		it("should return true for valid URL", () => {
			expect(validateCloudBeaverURL("http://localhost:8080")).toBe(true);
		});

		it("should return error for missing input", () => {
			expect(validateCloudBeaverURL("")).toContain("required");
		});

		it("should return error for invalid protocol", () => {
			expect(validateCloudBeaverURL("ftp://localhost")).toContain(
				"HTTP or HTTPS",
			);
		});

		it("should return error for invalid port", () => {
			// URL constructor throws for invalid ports > 65535, so we catch invalid URL format
			const result = validateCloudBeaverURL("http://localhost:70000");
			expect(
				result === "Invalid port in URL" || result === "Invalid URL format",
			).toBe(true);
		});

		it("should return error for invalid URL string", () => {
			expect(validateCloudBeaverURL("invalid")).toBe("Invalid URL format");
		});
	});

	describe("checkEnvFile", () => {
		it("should return true if .env exists", () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			expect(checkEnvFile()).toBe(true);
			expect(fs.existsSync).toHaveBeenCalledWith(".env");
		});

		it("should return false if .env does not exist", () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);
			expect(checkEnvFile()).toBe(false);
		});
	});

	describe("initializeEnvFile", () => {
		const mockAnswers = { CI: "false" };

		it("should initialize env file successfully", () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue("KEY=VALUE");
			vi.mocked(dotenv.parse).mockReturnValue({ KEY: "VALUE" });

			initializeEnvFile(mockAnswers);

			expect(fs.writeFileSync).toHaveBeenCalled();
		});

		it("should throw error if source env file is missing", () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			expect(() => initializeEnvFile(mockAnswers)).toThrow(TalawaRestError);
			expect(() => initializeEnvFile(mockAnswers)).toThrow("is missing");
		});

		it("should throw error if read/write fails", () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error("Read failed");
			});

			expect(() => initializeEnvFile(mockAnswers)).toThrow(TalawaRestError);
			expect(() => initializeEnvFile(mockAnswers)).toThrow(
				"Failed to load environment file",
			);
		});
	});
});
