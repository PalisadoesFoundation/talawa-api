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

[src/services/CommentCache/cacheComments.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/services/CommentCache/cacheComments.ts#L10)
