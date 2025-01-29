[**talawa-api**](../../../README.md)

***

# Function: isAuth()

> **isAuth**(`request`): [`InterfaceAuthData`](../interfaces/InterfaceAuthData.md)

This function determines whether the user is authorised and whether the access token has expired.

## Parameters

### request

`Request`

User Request object from Express.

## Returns

[`InterfaceAuthData`](../interfaces/InterfaceAuthData.md)

Returns `authData` object with `isAuth`, `expired` and `userId` properties.

## Defined in

[src/middleware/isAuth.ts:18](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/middleware/isAuth.ts#L18)
