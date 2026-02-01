[API Docs](/)

***

# Class: GitHubOAuthProvider

Defined in: [src/utilities/auth/oauth/providers/GitHubOAuthProvider.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GitHubOAuthProvider.ts#L19)

GitHub OAuth provider implementation.
Handles authentication flow with GitHub OAuth service.

Features:
- Exchange authorization codes for access tokens
- Fetch user profile information from GitHub API
- Handle private email addresses by fetching from emails endpoint

## Extends

- [`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md)

## Constructors

### Constructor

> **new GitHubOAuthProvider**(`config`): `GitHubOAuthProvider`

Defined in: [src/utilities/auth/oauth/providers/GitHubOAuthProvider.ts:25](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GitHubOAuthProvider.ts#L25)

Creates a new GitHub OAuth provider instance.

#### Parameters

##### config

[`OAuthConfig`](../../../types/interfaces/OAuthConfig.md)

OAuth configuration containing client credentials and settings

#### Returns

`GitHubOAuthProvider`

#### Overrides

[`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md).[`constructor`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md#constructor)

## Methods

### exchangeCodeForTokens()

> **exchangeCodeForTokens**(`code`, `redirectUri`): `Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Defined in: [src/utilities/auth/oauth/providers/GitHubOAuthProvider.ts:37](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GitHubOAuthProvider.ts#L37)

Exchanges an authorization code for access tokens using GitHub's OAuth service.

#### Parameters

##### code

`string`

Authorization code received from GitHub OAuth callback

##### redirectUri

`string`

Redirect URI used in the initial authorization request

#### Returns

`Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Promise resolving to OAuth tokens (access_token, refresh_token, etc.)

#### Throws

If token exchange fails

#### Overrides

[`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md).[`exchangeCodeForTokens`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md#exchangecodefortokens)

***

### getProviderName()

> **getProviderName**(): `string`

Defined in: [src/utilities/auth/oauth/providers/BaseOAuthProvider.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/BaseOAuthProvider.ts#L32)

Get the unique name identifier for this provider

#### Returns

`string`

Provider name (e.g., "google", "github")

#### Inherited from

[`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md).[`getProviderName`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md#getprovidername)

***

### getUserProfile()

> **getUserProfile**(`accessToken`): `Promise`\<[`OAuthUserProfile`](../../../types/interfaces/OAuthUserProfile.md)\>

Defined in: [src/utilities/auth/oauth/providers/GitHubOAuthProvider.ts:74](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GitHubOAuthProvider.ts#L74)

Fetches user profile information from GitHub API.

If the user's primary email is not public, attempts to fetch it from
the user's private email addresses (requires 'user:email' scope).

#### Parameters

##### accessToken

`string`

GitHub access token with appropriate scopes

#### Returns

`Promise`\<[`OAuthUserProfile`](../../../types/interfaces/OAuthUserProfile.md)\>

Promise resolving to standardized user profile data

#### Throws

If profile fetch fails

#### Overrides

[`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md).[`getUserProfile`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md#getuserprofile)
