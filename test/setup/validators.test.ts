/**
 * Tests for Setup Validators Module
 * @module test/setup/validators.test
 */

import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	generateJwtSecret,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validateEmail,
	validatePort,
	validateURL,
} from "../../scripts/setup/validators";

/**
 * Note: Backward compatibility of re-exports from setup.ts is verified by:
 * 1. TypeScript compilation (type checking ensures exports exist)
 * 2. CodeRabbit static analysis (verified in PR review)
 * Tests cannot import setup.ts directly due to its dependencies on main project modules.
 */

describe("validators", () => {
	describe("generateJwtSecret", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("returns a 128-character hexadecimal string", () => {
			const secret = generateJwtSecret();
			expect(secret).toHaveLength(128);
			expect(/^[0-9a-f]+$/.test(secret)).toBe(true);
		});

		it("calls crypto.randomBytes with 64 bytes", () => {
			const spy = vi.spyOn(crypto, "randomBytes");
			const secret = generateJwtSecret();
			expect(spy).toHaveBeenCalledWith(64);
			expect(secret).toHaveLength(128);
		});

		it("throws error when crypto.randomBytes fails", () => {
			vi.spyOn(crypto, "randomBytes").mockImplementation(() => {
				throw new Error("Entropy source unavailable");
			});

			expect(() => generateJwtSecret()).toThrow(
				"Failed to generate JWT secret",
			);
		});
	});

	describe("validateURL", () => {
		it("returns true for valid HTTP URL", () => {
			expect(validateURL("http://example.com")).toBe(true);
		});

		it("returns true for valid HTTPS URL", () => {
			expect(validateURL("https://example.com")).toBe(true);
		});

		it("returns true for URL with port", () => {
			expect(validateURL("http://localhost:8080")).toBe(true);
		});

		it("returns true for URL with path", () => {
			expect(validateURL("https://example.com/api/v1")).toBe(true);
		});

		it("returns error for FTP protocol", () => {
			expect(validateURL("ftp://example.com")).toBe(
				"Please enter a valid URL with http:// or https:// protocol.",
			);
		});

		it("returns error for file protocol", () => {
			expect(validateURL("file:///path/to/file")).toBe(
				"Please enter a valid URL with http:// or https:// protocol.",
			);
		});

		it("returns error for malformed URL", () => {
			expect(validateURL("not-a-url")).toBe("Please enter a valid URL.");
		});

		it("returns error for empty string", () => {
			expect(validateURL("")).toBe("Please enter a valid URL.");
		});
	});

	describe("validatePort", () => {
		it("returns true for valid port 80", () => {
			expect(validatePort("80")).toBe(true);
		});

		it("returns true for valid port 443", () => {
			expect(validatePort("443")).toBe(true);
		});

		it("returns true for minimum valid port 1", () => {
			expect(validatePort("1")).toBe(true);
		});

		it("returns true for maximum valid port 65535", () => {
			expect(validatePort("65535")).toBe(true);
		});

		it("returns true for common port 8080", () => {
			expect(validatePort("8080")).toBe(true);
		});

		it("returns error for port 0", () => {
			expect(validatePort("0")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for port exceeding 65535", () => {
			expect(validatePort("65536")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for negative port", () => {
			expect(validatePort("-1")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for decimal port like 8080.5", () => {
			expect(validatePort("8080.5")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for non-numeric input", () => {
			expect(validatePort("abc")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for empty string", () => {
			expect(validatePort("")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for port with leading zeros like 08080", () => {
			expect(validatePort("08080")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});

		it("returns error for port with whitespace only", () => {
			expect(validatePort("   ")).toBe(
				"Please enter a valid port number (1-65535).",
			);
		});
	});

	describe("validateEmail", () => {
		it("returns true for valid email", () => {
			expect(validateEmail("user@example.com")).toBe(true);
		});

		it("returns true for email with subdomain", () => {
			expect(validateEmail("user@mail.example.com")).toBe(true);
		});

		it("returns true for email with plus sign", () => {
			expect(validateEmail("user+tag@example.com")).toBe(true);
		});

		it("returns true for email with dots in local part", () => {
			expect(validateEmail("first.last@example.com")).toBe(true);
		});

		it("returns error for empty email", () => {
			expect(validateEmail("")).toBe("Email cannot be empty.");
		});

		it("returns error for whitespace-only email", () => {
			expect(validateEmail("   ")).toBe("Email cannot be empty.");
		});

		it("returns error for email exceeding 254 characters", () => {
			const longEmail = `${"a".repeat(250)}@example.com`;
			expect(validateEmail(longEmail)).toBe("Email is too long.");
		});

		it("returns error for email without @", () => {
			expect(validateEmail("userexample.com")).toBe(
				"Invalid email format. Please enter a valid email address.",
			);
		});

		it("returns error for email without domain", () => {
			expect(validateEmail("user@")).toBe(
				"Invalid email format. Please enter a valid email address.",
			);
		});

		it("returns error for email without TLD", () => {
			expect(validateEmail("user@example")).toBe(
				"Invalid email format. Please enter a valid email address.",
			);
		});

		it("returns error for email with spaces", () => {
			expect(validateEmail("user @example.com")).toBe(
				"Invalid email format. Please enter a valid email address.",
			);
		});
	});

	describe("validateCloudBeaverAdmin", () => {
		it("returns true for valid admin name", () => {
			expect(validateCloudBeaverAdmin("admin")).toBe(true);
		});

		it("returns true for admin name with numbers", () => {
			expect(validateCloudBeaverAdmin("admin123")).toBe(true);
		});

		it("returns true for admin name with underscore", () => {
			expect(validateCloudBeaverAdmin("admin_user")).toBe(true);
		});

		it("returns true for minimum length name (3 chars)", () => {
			expect(validateCloudBeaverAdmin("abc")).toBe(true);
		});

		it("returns error for empty admin name", () => {
			expect(validateCloudBeaverAdmin("")).toBe("Admin name is required");
		});

		it("returns error for whitespace-only admin name", () => {
			expect(validateCloudBeaverAdmin("   ")).toBe("Admin name is required");
		});

		it("returns error for admin name less than 3 characters", () => {
			expect(validateCloudBeaverAdmin("ab")).toBe(
				"Admin name must be at least 3 characters long",
			);
		});

		it("returns error for admin name with special characters", () => {
			expect(validateCloudBeaverAdmin("admin@user")).toBe(
				"Admin name can only contain letters, numbers, and underscores",
			);
		});

		it("returns error for admin name with spaces", () => {
			expect(validateCloudBeaverAdmin("admin user")).toBe(
				"Admin name can only contain letters, numbers, and underscores",
			);
		});

		it("returns error for admin name with hyphen", () => {
			expect(validateCloudBeaverAdmin("admin-user")).toBe(
				"Admin name can only contain letters, numbers, and underscores",
			);
		});
	});

	describe("validateCloudBeaverPassword", () => {
		it("returns true for valid password with letters and numbers", () => {
			expect(validateCloudBeaverPassword("password123")).toBe(true);
		});

		it("returns true for password with special characters", () => {
			expect(validateCloudBeaverPassword("Pass@word1")).toBe(true);
		});

		it("returns true for minimum length password (8 chars)", () => {
			expect(validateCloudBeaverPassword("pass1234")).toBe(true);
		});

		it("returns error for empty password", () => {
			expect(validateCloudBeaverPassword("")).toBe("Password is required");
		});

		it("returns error for whitespace-only password", () => {
			expect(validateCloudBeaverPassword("   ")).toBe("Password is required");
		});

		it("returns error for password less than 8 characters", () => {
			expect(validateCloudBeaverPassword("pass1")).toBe(
				"Password must be at least 8 characters long",
			);
		});

		it("returns error for password without numbers", () => {
			expect(validateCloudBeaverPassword("passwordonly")).toBe(
				"Password must contain both letters and numbers",
			);
		});

		it("returns error for password without letters", () => {
			expect(validateCloudBeaverPassword("12345678")).toBe(
				"Password must contain both letters and numbers",
			);
		});
	});

	describe("validateCloudBeaverURL", () => {
		it("returns true for valid HTTP URL", () => {
			expect(validateCloudBeaverURL("http://localhost:8978")).toBe(true);
		});

		it("returns true for valid HTTPS URL", () => {
			expect(validateCloudBeaverURL("https://cloudbeaver.example.com")).toBe(
				true,
			);
		});

		it("returns true for URL with default HTTP port", () => {
			expect(validateCloudBeaverURL("http://localhost")).toBe(true);
		});

		it("returns true for URL with default HTTPS port", () => {
			expect(validateCloudBeaverURL("https://localhost")).toBe(true);
		});

		it("returns error for empty URL", () => {
			expect(validateCloudBeaverURL("")).toBe("Server URL is required");
		});

		it("returns error for whitespace-only URL", () => {
			expect(validateCloudBeaverURL("   ")).toBe("Server URL is required");
		});

		it("returns error for FTP protocol", () => {
			expect(validateCloudBeaverURL("ftp://localhost:8978")).toBe(
				"URL must use HTTP or HTTPS protocol",
			);
		});

		it("returns error for malformed URL", () => {
			expect(validateCloudBeaverURL("not-a-url")).toBe("Invalid URL format");
		});

		it("returns error for URL with invalid port 0", () => {
			expect(validateCloudBeaverURL("http://localhost:0")).toBe(
				"Invalid port in URL",
			);
		});

		it("returns error for URL with port exceeding 65535", () => {
			expect(validateCloudBeaverURL("http://localhost:99999")).toBe(
				"Invalid port in URL",
			);
		});
	});
});
