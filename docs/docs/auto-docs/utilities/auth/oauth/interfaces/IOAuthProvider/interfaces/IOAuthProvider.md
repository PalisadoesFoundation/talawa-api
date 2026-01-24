[**talawa-api**](../../../../../../README.md)

***

# Interface: IOAuthProvider

Defined in: [src/utilities/auth/oauth/interfaces/IOAuthProvider.ts:7](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/interfaces/IOAuthProvider.ts#L7)

Interface for OAuth2 provider implementations
All providers must implement this interface to ensure consistent behavior

## Methods

### exchangeCodeForTokens()

> **exchangeCodeForTokens**(`code`, `redirectUri`): `Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Defined in: [src/utilities/auth/oauth/interfaces/IOAuthProvider.ts:22](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/interfaces/IOAuthProvider.ts#L22)

Exchange authorization code for access tokens

#### Parameters

##### code

`string`

Authorization code from OAuth callback

##### redirectUri

`string`

Redirect URI used in authorization request

#### Returns

`Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Token response with access token and optional refresh token

#### Throws

If token exchange fails

#### Throws

If authorization code is invalid

***

### getProviderName()

> **getProviderName**(): `string`

Defined in: [src/utilities/auth/oauth/interfaces/IOAuthProvider.ts:12](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/interfaces/IOAuthProvider.ts#L12)

Get the unique name identifier for this provider

#### Returns

`string`

Provider name (e.g., "google", "github")

***

### getUserProfile()

> **getUserProfile**(`accessToken`): `Promise`\<[`OAuthUserProfile`](../../../types/interfaces/OAuthUserProfile.md)\>

Defined in: [src/utilities/auth/oauth/interfaces/IOAuthProvider.ts:33](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/interfaces/IOAuthProvider.ts#L33)

Fetch user profile information using access token

#### Parameters

##### accessToken

`string`

OAuth access token

#### Returns

`Promise`\<[`OAuthUserProfile`](../../../types/interfaces/OAuthUserProfile.md)\>

User profile with provider ID, email, and optional metadata

#### Throws

If profile fetch fails
