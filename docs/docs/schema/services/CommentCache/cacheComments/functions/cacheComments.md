[**talawa-api**](../../../../README.md)

***

# Function: cacheComments()

> **cacheComments**(`comments`): `Promise`\<`void`\>

Stores comments in Redis cache with a specified time-to-live (TTL).

## Parameters

### comments

[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)[]

Array of comments to be cached.

## Returns

`Promise`\<`void`\>

Promise<void>

## Defined in

[src/services/CommentCache/cacheComments.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/services/CommentCache/cacheComments.ts#L10)
