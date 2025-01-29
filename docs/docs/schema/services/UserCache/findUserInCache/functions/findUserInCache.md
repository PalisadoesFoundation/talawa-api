[Admin Docs](/)

***

# Function: findUserInCache()

> **findUserInCache**(`ids`): `Promise`\<([`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md) \| `null`)[]\>

Retrieves user data from cache based on provided IDs.

## Parameters

### ids

`string`[]

An array of user IDs to retrieve from cache.

## Returns

`Promise`\<([`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md) \| `null`)[]\>

A promise resolving to an array of InterfaceUser objects or null if not found in cache.

## Defined in

[src/services/UserCache/findUserInCache.ts:12](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/UserCache/findUserInCache.ts#L12)
