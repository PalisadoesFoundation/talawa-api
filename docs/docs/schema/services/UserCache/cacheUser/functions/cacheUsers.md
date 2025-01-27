[**talawa-api**](../../../../README.md)

***

# Function: cacheUsers()

> **cacheUsers**(`users`): `Promise`\<`void`\>

Caches the provided array of InterfaceUser objects in Redis.

## Parameters

### users

[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)[]

An array of InterfaceUser objects to be cached.

## Returns

`Promise`\<`void`\>

A promise resolving to void.

## Defined in

[src/services/UserCache/cacheUser.ts:11](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/services/UserCache/cacheUser.ts#L11)
