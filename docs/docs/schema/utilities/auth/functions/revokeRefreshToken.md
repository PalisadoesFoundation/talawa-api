[Admin Docs](/)

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

[src/utilities/auth.ts:86](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/auth.ts#L86)
