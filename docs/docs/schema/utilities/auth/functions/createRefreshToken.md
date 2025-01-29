[**talawa-api**](../../../README.md)

***

# Function: createRefreshToken()

> **createRefreshToken**(`user`, `appUserProfile`): `string`

Creates a refresh token (JWT) for a user that expires in 30 days.
The token contains user data and is signed with the refresh token secret.

## Parameters

### user

[`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)

User data

### appUserProfile

[`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)

Application user profile data

## Returns

`string`

JSON Web Token string payload

## Defined in

[src/utilities/auth.ts:60](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/auth.ts#L60)
