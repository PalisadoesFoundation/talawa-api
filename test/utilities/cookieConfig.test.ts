import { describe, expect, it } from "vitest";
import {
	COOKIE_NAMES,
	getAccessTokenCookieOptions,
	getClearAccessTokenCookieOptions,
	getClearRefreshTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from "../../src/utilities/cookieConfig";

describe("Cookie Configuration", () => {
	describe("COOKIE_NAMES", () => {
		it("should have correct cookie names", () => {
			expect(COOKIE_NAMES.ACCESS_TOKEN).toBe("talawa_access_token");
			expect(COOKIE_NAMES.REFRESH_TOKEN).toBe("talawa_refresh_token");
		});
	});

	describe("getAccessTokenCookieOptions", () => {
		it("should return correct options for secure environment", () => {
			const options = getAccessTokenCookieOptions(
				{ isSecure: true, path: "/" },
				3600000,
			);
			expect(options).toEqual({
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 3600,
				domain: undefined,
			});
		});

		it("should return correct options for non-secure environment", () => {
			const options = getAccessTokenCookieOptions(
				{ isSecure: false, path: "/" },
				3600000,
			);
			expect(options).toEqual({
				httpOnly: true,
				secure: false,
				sameSite: "lax",
				path: "/",
				maxAge: 3600,
				domain: undefined,
			});
		});

		it("should handle custom domain", () => {
			const options = getAccessTokenCookieOptions(
				{ isSecure: true, domain: "example.com" },
				3600000,
			);
			expect(options.domain).toBe("example.com");
		});

		it("should default path to /", () => {
			const options = getAccessTokenCookieOptions({ isSecure: true }, 3600000);
			expect(options.path).toBe("/");
		});
	});

	describe("getRefreshTokenCookieOptions", () => {
		it("should return correct options for secure environment", () => {
			const options = getRefreshTokenCookieOptions(
				{ isSecure: true, path: "/" },
				3600000,
			);
			expect(options).toEqual({
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 3600,
				domain: undefined,
			});
		});

		it("should return correct options for non-secure environment", () => {
			const options = getRefreshTokenCookieOptions(
				{ isSecure: false, path: "/" },
				3600000,
			);
			expect(options).toEqual({
				httpOnly: true,
				secure: false,
				sameSite: "lax",
				path: "/",
				maxAge: 3600,
				domain: undefined,
			});
		});

		it("should handle custom domain", () => {
			const options = getRefreshTokenCookieOptions(
				{ isSecure: true, domain: "example.com" },
				3600000,
			);
			expect(options.domain).toBe("example.com");
		});

		it("should default path to /", () => {
			const options = getRefreshTokenCookieOptions({ isSecure: true }, 3600000);
			expect(options.path).toBe("/");
		});
	});

	describe("getClearAccessTokenCookieOptions", () => {
		it("should return correct options to clear cookie", () => {
			const options = getClearAccessTokenCookieOptions({
				isSecure: true,
				path: "/",
			});
			expect(options).toEqual({
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 0,
				domain: undefined,
			});
		});
	});

	describe("getClearRefreshTokenCookieOptions", () => {
		it("should return correct options to clear cookie", () => {
			const options = getClearRefreshTokenCookieOptions({
				isSecure: true,
				path: "/",
			});
			expect(options).toEqual({
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 0,
				domain: undefined,
			});
		});
	});
});
