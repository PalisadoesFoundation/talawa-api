[Admin Docs](/)

***

# Function: cachePosts()

> **cachePosts**(`posts`): `Promise`\<`void`\>

Caches the provided array of InterfacePost objects in Redis.

## Parameters

### posts

[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)[]

An array of InterfacePost objects to be cached.

## Returns

`Promise`\<`void`\>

A promise resolving to void.

## Defined in

[src/services/PostCache/cachePosts.ts:11](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/PostCache/cachePosts.ts#L11)
