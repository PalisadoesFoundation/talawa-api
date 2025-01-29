[Admin Docs](/)

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

[src/services/UserCache/cacheUser.ts:11](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/UserCache/cacheUser.ts#L11)
