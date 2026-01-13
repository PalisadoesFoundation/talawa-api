import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type IOAuthProvider,
	OAuthError,
	OAuthProviderRegistry,
	type OAuthProviderTokenResponse,
	type OAuthUserProfile,
} from "~/src/utilities/auth/oauth";

class MockProvider implements IOAuthProvider {
	constructor(private name: string) {}

	getProviderName(): string {
		return this.name;
	}

	async exchangeCodeForTokens(
		_code: string,
		_redirectUri: string,
	): Promise<OAuthProviderTokenResponse> {
		return {
			access_token: "mock_access_token",
			token_type: "Bearer",
			expires_in: 3600,
		};
	}

	async getUserProfile(_accessToken: string): Promise<OAuthUserProfile> {
		return {
			providerId: "123456",
			email: "test@example.com",
			name: "Test User",
			emailVerified: true,
		};
	}
}

describe("OAuthProviderRegistry", () => {
	let registry: OAuthProviderRegistry;

	beforeEach(() => {
		registry = OAuthProviderRegistry.getInstance();
		registry.clear(); // Clear between tests
	});

	afterEach(() => {
		registry.clear();
	});

	describe("register()", () => {
		it("should register a provider successfully", () => {
			const provider = new MockProvider("google");
			registry.register(provider);

			expect(registry.has("google")).toBe(true);
			expect(registry.listProviders()).toContain("google");
		});

		it("should handle provider names case-insensitively", () => {
			const provider = new MockProvider("Google");
			registry.register(provider);

			expect(registry.has("google")).toBe(true);
			expect(registry.has("GOOGLE")).toBe(true);
			expect(registry.has("Google")).toBe(true);
		});

		it("should throw error for duplicate registration", () => {
			const provider1 = new MockProvider("google");
			const provider2 = new MockProvider("google");

			registry.register(provider1);

			expect(() => registry.register(provider2)).toThrow(OAuthError);
			expect(() => registry.register(provider2)).toThrow(
				expect.objectContaining({
					code: "DUPLICATE_PROVIDER",
					statusCode: 409,
				}),
			);
		});
		it("should register multiple different providers", () => {
			const google = new MockProvider("google");
			const github = new MockProvider("github");

			registry.register(google);
			registry.register(github);

			expect(registry.listProviders()).toHaveLength(2);
			expect(registry.listProviders()).toEqual(
				expect.arrayContaining(["google", "github"]),
			);
		});

		it("should throw error for empty provider name", () => {
			const provider = new MockProvider("");

			expect(() => registry.register(provider)).toThrow(OAuthError);
			expect(() => registry.register(provider)).toThrow(
				expect.objectContaining({
					code: "INVALID_PROVIDER_NAME",
					statusCode: 400,
				}),
			);
		});

		it("should throw error for whitespace-only provider name", () => {
			const provider = new MockProvider("   ");

			expect(() => registry.register(provider)).toThrow(OAuthError);
			expect(() => registry.register(provider)).toThrow(
				expect.objectContaining({
					code: "INVALID_PROVIDER_NAME",
					statusCode: 400,
				}),
			);
		});
	});

	describe("get()", () => {
		it("should retrieve registered provider", () => {
			const provider = new MockProvider("google");
			registry.register(provider);

			const retrieved = registry.get("google");
			expect(retrieved.getProviderName()).toBe("google");
		});

		it("should retrieve provider case-insensitively", () => {
			const provider = new MockProvider("google");
			registry.register(provider);

			expect(registry.get("GOOGLE").getProviderName()).toBe("google");
			expect(registry.get("Google").getProviderName()).toBe("google");
		});

		it("should throw error when provider not found", () => {
			expect(() => registry.get("nonexistent")).toThrow(OAuthError);
			expect(() => registry.get("nonexistent")).toThrow(
				expect.objectContaining({
					code: "PROVIDER_NOT_FOUND",
					statusCode: 404,
				}),
			);
		});

		it("should include available providers in error message", () => {
			registry.register(new MockProvider("google"));
			registry.register(new MockProvider("github"));

			expect(() => registry.get("facebook")).toThrow(OAuthError);
			expect(() => registry.get("facebook")).toThrow(
				expect.objectContaining({ code: "PROVIDER_NOT_FOUND" }),
			);
			expect(() => registry.get("facebook")).toThrow(/google/);
			expect(() => registry.get("facebook")).toThrow(/github/);
		});

		it("should throw error for empty provider name", () => {
			expect(() => registry.get("")).toThrow(OAuthError);
			expect(() => registry.get("")).toThrow(
				expect.objectContaining({
					code: "INVALID_PROVIDER_NAME",
					statusCode: 400,
				}),
			);
		});

		it("should throw error for whitespace-only provider name", () => {
			expect(() => registry.get("   ")).toThrow(OAuthError);
			expect(() => registry.get("   ")).toThrow(
				expect.objectContaining({
					code: "INVALID_PROVIDER_NAME",
					statusCode: 400,
				}),
			);
		});
	});

	describe("has()", () => {
		it("should return true for registered provider", () => {
			const provider = new MockProvider("google");
			registry.register(provider);

			expect(registry.has("google")).toBe(true);
		});

		it("should handle whitespace in provider name", () => {
			registry.register(new MockProvider("google"));
			expect(registry.has("  google  ")).toBe(true);
		});

		it("should return false for unregistered provider", () => {
			expect(registry.has("google")).toBe(false);
		});

		it("should check case-insensitively", () => {
			const provider = new MockProvider("google");
			registry.register(provider);

			expect(registry.has("GOOGLE")).toBe(true);
			expect(registry.has("Google")).toBe(true);
		});
	});

	describe("listProviders()", () => {
		it("should return empty array when no providers registered", () => {
			expect(registry.listProviders()).toEqual([]);
		});

		it("should return all registered provider names", () => {
			registry.register(new MockProvider("google"));
			registry.register(new MockProvider("github"));
			registry.register(new MockProvider("facebook"));

			const providers = registry.listProviders();
			expect(providers).toHaveLength(3);
			expect(providers).toEqual(
				expect.arrayContaining(["google", "github", "facebook"]),
			);
		});
	});

	describe("unregister()", () => {
		it("should remove registered provider", () => {
			const provider = new MockProvider("google");
			registry.register(provider);

			expect(registry.has("google")).toBe(true);

			registry.unregister("google");

			expect(registry.has("google")).toBe(false);
		});

		it("should handle unregistering non-existent provider gracefully", () => {
			expect(() => registry.unregister("nonexistent")).not.toThrow();
		});

		it("should unregister case-insensitively", () => {
			registry.register(new MockProvider("google"));
			registry.unregister("GOOGLE");
			expect(registry.has("google")).toBe(false);
		});
	});

	describe("clear()", () => {
		it("should remove all providers", () => {
			registry.register(new MockProvider("google"));
			registry.register(new MockProvider("github"));

			expect(registry.listProviders()).toHaveLength(2);

			registry.clear();

			expect(registry.listProviders()).toHaveLength(0);
			expect(registry.has("google")).toBe(false);
			expect(registry.has("github")).toBe(false);
		});
	});

	describe("singleton behavior", () => {
		it("should return same instance", () => {
			const instance1 = OAuthProviderRegistry.getInstance();
			const instance2 = OAuthProviderRegistry.getInstance();

			expect(instance1).toBe(instance2);
		});

		it("should maintain state across getInstance calls", () => {
			const instance1 = OAuthProviderRegistry.getInstance();
			instance1.register(new MockProvider("google"));

			const instance2 = OAuthProviderRegistry.getInstance();
			expect(instance2.has("google")).toBe(true);
		});
	});
});
