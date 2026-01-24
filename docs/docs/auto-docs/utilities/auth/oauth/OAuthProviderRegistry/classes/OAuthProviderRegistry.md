[API Docs](/)

***

# Class: OAuthProviderRegistry

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:8

Registry for managing OAuth provider instances
Singleton pattern to ensure one registry per application

## Methods

### clear()

> **clear**(): `void`

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:104

Clear all providers (for testing)

#### Returns

`void`

***

### get()

> **get**(`providerName`): [`IOAuthProvider`](../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md)

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:54

Get provider by name

#### Parameters

##### providerName

`string`

Name of the provider

#### Returns

[`IOAuthProvider`](../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md)

Provider instance

#### Throws

If provider not found

***

### has()

> **has**(`providerName`): `boolean`

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:81

Check if provider is registered

#### Parameters

##### providerName

`string`

Name of the provider

#### Returns

`boolean`

True if provider exists

***

### listProviders()

> **listProviders**(): `string`[]

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:89

Get all registered provider names

#### Returns

`string`[]

Array of provider names

***

### register()

> **register**(`provider`): `void`

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:27

Register an OAuth provider

#### Parameters

##### provider

[`IOAuthProvider`](../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md)

Provider instance to register

#### Returns

`void`

#### Throws

If provider is already registered

***

### unregister()

> **unregister**(`providerName`): `void`

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:97

Remove a provider from registry (for testing)

#### Parameters

##### providerName

`string`

Name of provider to remove

#### Returns

`void`

***

### getInstance()

> `static` **getInstance**(): `OAuthProviderRegistry`

Defined in: src/utilities/auth/oauth/OAuthProviderRegistry.ts:17

Get singleton instance

#### Returns

`OAuthProviderRegistry`
