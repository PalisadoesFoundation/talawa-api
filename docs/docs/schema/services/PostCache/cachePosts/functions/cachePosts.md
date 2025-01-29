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

[src/services/PostCache/cachePosts.ts:11](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/services/PostCache/cachePosts.ts#L11)
