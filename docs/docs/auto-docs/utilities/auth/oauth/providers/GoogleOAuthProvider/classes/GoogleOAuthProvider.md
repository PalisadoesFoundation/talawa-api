[API Docs](/)

***

# Class: GoogleOAuthProvider

Defined in: [src/utilities/auth/oauth/providers/GoogleOAuthProvider.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GoogleOAuthProvider.ts#L30)

Google OAuth 2.0 provider implementation
Handles code exchange and user profile retrieval from Google's OAuth endpoints

## Example

```typescript
const provider = new GoogleOAuthProvider({
  clientId: "your-client-id.apps.googleusercontent.com",
  clientSecret: "your-client-secret",
  redirectUri: "http://localhost:3000/auth/google/callback"
});

// Exchange authorization code for tokens
const tokens = await provider.exchangeCodeForTokens(
  "authorization-code-from-callback",
  "http://localhost:3000/auth/google/callback"
);

// Fetch user profile
const profile = await provider.getUserProfile(tokens.access_token);
console.log(profile); // { providerId: "...", email: "...", name: "..." }
```

## See

https://developers.google.com/identity/protocols/oauth2/web-server

## Extends

- [`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md)

## Constructors

### Constructor

> **new GoogleOAuthProvider**(`config`): `GoogleOAuthProvider`

Defined in: [src/utilities/auth/oauth/providers/GoogleOAuthProvider.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GoogleOAuthProvider.ts#L42)

#### Parameters

##### config

[`OAuthConfig`](../../../types/interfaces/OAuthConfig.md)

#### Returns

`GoogleOAuthProvider`

#### Overrides

[`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md).[`constructor`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md#constructor)

## Methods

### exchangeCodeForTokens()

> **exchangeCodeForTokens**(`code`, `redirectUri?`): `Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Defined in: [src/utilities/auth/oauth/providers/GoogleOAuthProvider.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GoogleOAuthProvider.ts#L53)

Exchange authorization code for access tokens

#### Parameters

##### code

`string`

Authorization code from Google OAuth callback

##### redirectUri?

`string`

Optional redirect URI that was used in the authorization request. If not provided, uses config redirectUri

#### Returns

`Promise`\<[`OAuthProviderTokenResponse`](../../../types/interfaces/OAuthProviderTokenResponse.md)\>

Token response with access token and optional refresh token

#### Throws

If token exchange fails (e.g., invalid_grant, invalid_client) or if no redirect URI is available

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

Defined in: [src/utilities/auth/oauth/providers/GoogleOAuthProvider.ts:92](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/providers/GoogleOAuthProvider.ts#L92)

Fetch user profile from Google userinfo endpoint

#### Parameters

##### accessToken

`string`

Access token obtained from token exchange

#### Returns

`Promise`\<[`OAuthUserProfile`](../../../types/interfaces/OAuthUserProfile.md)\>

Normalized user profile

#### Throws

If profile fetch fails

#### Overrides

[`BaseOAuthProvider`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md).[`getUserProfile`](../../BaseOAuthProvider/classes/BaseOAuthProvider.md#getuserprofile)
