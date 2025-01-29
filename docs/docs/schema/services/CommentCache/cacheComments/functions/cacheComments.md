[Admin Docs](/)

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

Promise`void`

## Defined in

[src/services/CommentCache/cacheComments.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/CommentCache/cacheComments.ts#L10)
