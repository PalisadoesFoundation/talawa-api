[API Docs](/)

***

# Function: buildOAuthProviderRegistry()

> **buildOAuthProviderRegistry**(): [`OAuthProviderRegistry`](../../OAuthProviderRegistry/classes/OAuthProviderRegistry.md)

Defined in: [src/utilities/auth/oauth/providerFactory.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providerFactory.ts#L12)

Builds and initializes the OAuth provider registry from configuration.
Clears any existing providers (idempotent) and registers enabled providers.
`@returns` The populated OAuthProviderRegistry singleton instance

## Returns

[`OAuthProviderRegistry`](../../OAuthProviderRegistry/classes/OAuthProviderRegistry.md)
