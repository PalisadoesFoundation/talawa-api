[**talawa-api**](../../../README.md)

***

# Function: createAccessToken()

> **createAccessToken**(`user`, `appUserProfile`): `Promise`\<`string`\>

Creates an access token (JWT) for a user that expires in 40 minutes.
The token contains user data and is signed with the access token secret.

## Parameters

### user

[`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)

User data

### appUserProfile

[`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)

Application user profile data

## Returns

`Promise`\<`string`\>

JSON Web Token string payload

## Defined in

[src/utilities/auth.ts:25](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/auth.ts#L25)
