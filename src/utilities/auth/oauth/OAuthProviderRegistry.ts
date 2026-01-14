import { OAuthError } from "./errors";
import type { IOAuthProvider } from "./interfaces/IOAuthProvider";

/**
 * Registry for managing OAuth provider instances
 * Singleton pattern to ensure one registry per application
 */
export class OAuthProviderRegistry {
	private providers: Map<string, IOAuthProvider> = new Map();
	private static instance?: OAuthProviderRegistry;

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): OAuthProviderRegistry {
		OAuthProviderRegistry.instance ??= new OAuthProviderRegistry();
		return OAuthProviderRegistry.instance;
	}

	/**
	 * Register an OAuth provider
	 * @param provider - Provider instance to register
	 * @throws {OAuthError} If provider is already registered
	 */
	register(provider: IOAuthProvider): void {
		const name = provider.getProviderName().trim().toLowerCase();
		if (!name) {
			throw new OAuthError(
				"Provider name must be non-empty",
				"INVALID_PROVIDER_NAME",
				400,
			);
		}

		if (this.providers.has(name)) {
			throw new OAuthError(
				`Provider "${name}" is already registered`,
				"DUPLICATE_PROVIDER",
				409,
			);
		}

		this.providers.set(name, provider);
	}

	/**
	 * Get provider by name
	 * @param providerName - Name of the provider
	 * @returns Provider instance
	 * @throws {OAuthError} If provider not found
	 */
	get(providerName: string): IOAuthProvider {
		const name = providerName.trim().toLowerCase();
		if (!name) {
			throw new OAuthError(
				"Provider name must be non-empty",
				"INVALID_PROVIDER_NAME",
				400,
			);
		}
		const provider = this.providers.get(name);

		if (!provider) {
			throw new OAuthError(
				`Provider "${providerName}" not found. Available providers: ${this.listProviders().join(", ")}`,
				"PROVIDER_NOT_FOUND",
				404,
			);
		}

		return provider;
	}

	/**
	 * Check if provider is registered
	 * @param providerName - Name of the provider
	 * @returns True if provider exists
	 */
	has(providerName: string): boolean {
		return this.providers.has(providerName.trim().toLowerCase());
	}

	/**
	 * Get all registered provider names
	 * @returns Array of provider names
	 */
	listProviders(): string[] {
		return Array.from(this.providers.keys());
	}

	/**
	 * Remove a provider from registry (for testing)
	 * @param providerName - Name of provider to remove
	 */
	unregister(providerName: string): void {
		this.providers.delete(providerName.trim().toLowerCase());
	}

	/**
	 * Clear all providers (for testing)
	 */
	clear(): void {
		this.providers.clear();
	}
}
