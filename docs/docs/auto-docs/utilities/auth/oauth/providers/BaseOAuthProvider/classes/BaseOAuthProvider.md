[API Docs](/)

***

# Abstract Class: BaseOAuthProvider

Defined in: [src/utilities/auth/oauth/providers/BaseOAuthProvider.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/BaseOAuthProvider.ts#L14)

Abstract base class for OAuth providers
Implements common HTTP logic and error handling

## Implements

- [`IOAuthProvider`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md)

## Constructors

### Constructor

> **new BaseOAuthProvider**(`config`): `BaseOAuthProvider`

Defined in: [src/utilities/auth/oauth/providers/BaseOAuthProvider.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/BaseOAuthProvider.ts#L17)

#### Parameters

##### config

[`OAuthConfig`](../../../types/interfaces/OAuthConfig.md)

#### Returns

`BaseOAuthProvider`

## Methods

### exchangeCodeForTokens()

> `abstract` **exchangeCodeForTokens**(`code`, `redirectUri`): `Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Defined in: [src/utilities/auth/oauth/providers/BaseOAuthProvider.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/BaseOAuthProvider.ts#L22)

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

#### Implementation of

[`IOAuthProvider`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md).[`exchangeCodeForTokens`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md#exchangecodefortokens)

***

### getProviderName()

> `abstract` **getProviderName**(): `string`

Defined in: [src/utilities/auth/oauth/providers/BaseOAuthProvider.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/BaseOAuthProvider.ts#L21)

Get the unique name identifier for this provider

#### Returns

`string`

Provider name (e.g., "google", "github")

#### Implementation of

[`IOAuthProvider`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md).[`getProviderName`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md#getprovidername)

***

### getUserProfile()

> `abstract` **getUserProfile**(`accessToken`): `Promise`\<[`OAuthUserProfile`](../../../types/interfaces/OAuthUserProfile.md)\>

Defined in: [src/utilities/auth/oauth/providers/BaseOAuthProvider.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/BaseOAuthProvider.ts#L26)

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

#### Implementation of

[`IOAuthProvider`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md).[`getUserProfile`](../../../interfaces/IOAuthProvider/interfaces/IOAuthProvider.md#getuserprofile)
