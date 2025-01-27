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

[src/services/CommentCache/cacheComments.ts:10](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/services/CommentCache/cacheComments.ts#L10)
