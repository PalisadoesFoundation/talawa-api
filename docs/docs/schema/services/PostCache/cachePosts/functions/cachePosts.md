[**talawa-api**](../../../../README.md)

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

[src/services/PostCache/cachePosts.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/services/PostCache/cachePosts.ts#L11)
