[**talawa-api**](../../../README.md)

***

# Function: revokeRefreshToken()

> **revokeRefreshToken**(`userId`): `Promise`\<`void`\>

Revokes the refresh token for a user by removing the token from the user's profile.
This function searches for the user by their ID and unsets the token field in the user's document.

## Parameters

### userId

`string`

The ID of the user whose refresh token is to be revoked

## Returns

`Promise`\<`void`\>

A promise that resolves when the token has been revoked

## Defined in

[src/utilities/auth.ts:86](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/auth.ts#L86)
