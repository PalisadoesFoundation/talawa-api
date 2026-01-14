import { describe, expect, it } from "vitest";
import * as OAuthModule from "../../../../src/utilities/auth/oauth/index";

describe("OAuth Index Module", () => {
	describe("exports", () => {
		it("should export BaseOAuthProvider class", () => {
			expect(OAuthModule).toHaveProperty("BaseOAuthProvider");
			expect(typeof OAuthModule.BaseOAuthProvider).toBe("function");
		});

		it("should export OAuthProviderRegistry class", () => {
			expect(OAuthModule).toHaveProperty("OAuthProviderRegistry");
			expect(typeof OAuthModule.OAuthProviderRegistry).toBe("function");
		});

		it("should export OAuth error classes", () => {
			expect(OAuthModule).toHaveProperty("OAuthError");
			expect(OAuthModule).toHaveProperty("InvalidAuthorizationCodeError");
			expect(OAuthModule).toHaveProperty("TokenExchangeError");
			expect(OAuthModule).toHaveProperty("ProfileFetchError");

			expect(typeof OAuthModule.OAuthError).toBe("function");
			expect(typeof OAuthModule.InvalidAuthorizationCodeError).toBe("function");
			expect(typeof OAuthModule.TokenExchangeError).toBe("function");
			expect(typeof OAuthModule.ProfileFetchError).toBe("function");
		});
	});

	describe("error classes inheritance", () => {
		it("should properly inherit from base Error class", () => {
			const oauthError = new OAuthModule.OAuthError(
				"Test message",
				"TEST_CODE",
			);
			const invalidCodeError = new OAuthModule.InvalidAuthorizationCodeError();
			const tokenError = new OAuthModule.TokenExchangeError();
			const profileError = new OAuthModule.ProfileFetchError();

			expect(oauthError).toBeInstanceOf(Error);
			expect(oauthError).toBeInstanceOf(OAuthModule.OAuthError);

			expect(invalidCodeError).toBeInstanceOf(Error);
			expect(invalidCodeError).toBeInstanceOf(OAuthModule.OAuthError);
			expect(invalidCodeError).toBeInstanceOf(
				OAuthModule.InvalidAuthorizationCodeError,
			);

			expect(tokenError).toBeInstanceOf(Error);
			expect(tokenError).toBeInstanceOf(OAuthModule.OAuthError);
			expect(tokenError).toBeInstanceOf(OAuthModule.TokenExchangeError);

			expect(profileError).toBeInstanceOf(Error);
			expect(profileError).toBeInstanceOf(OAuthModule.OAuthError);
			expect(profileError).toBeInstanceOf(OAuthModule.ProfileFetchError);
		});

		it("should have correct error properties", () => {
			const oauthError = new OAuthModule.OAuthError(
				"Test message",
				"TEST_CODE",
				400,
			);

			expect(oauthError.name).toBe("OAuthError");
			expect(oauthError.message).toBe("Test message");
			expect(oauthError.code).toBe("TEST_CODE");
			expect(oauthError.statusCode).toBe(400);
		});

		it("should have correct default values for specific error types", () => {
			const invalidCodeError = new OAuthModule.InvalidAuthorizationCodeError();
			const tokenError = new OAuthModule.TokenExchangeError();
			const profileError = new OAuthModule.ProfileFetchError();

			expect(invalidCodeError.code).toBe("INVALID_AUTHORIZATION_CODE");
			expect(invalidCodeError.statusCode).toBe(400);

			expect(tokenError.code).toBe("TOKEN_EXCHANGE_FAILED");
			expect(tokenError.statusCode).toBe(502);

			expect(profileError.code).toBe("PROFILE_FETCH_FAILED");
			expect(profileError.statusCode).toBe(502);
		});
	});

	describe("module structure", () => {
		it("should have all expected runtime exports", () => {
			const expectedExports = [
				"BaseOAuthProvider",
				"OAuthProviderRegistry",
				"OAuthError",
				"InvalidAuthorizationCodeError",
				"TokenExchangeError",
				"ProfileFetchError",
			];

			expectedExports.forEach((exportName) => {
				expect(OAuthModule).toHaveProperty(exportName);
			});
		});
	});
});
