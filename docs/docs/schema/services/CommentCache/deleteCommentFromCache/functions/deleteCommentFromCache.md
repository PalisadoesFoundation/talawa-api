[Admin Docs](/)

***

# Function: deleteCommentFromCache()

> **deleteCommentFromCache**(`comment`): `Promise`\<`void`\>

Deletes the specified comment from Redis cache.

## Parameters

### comment

[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)

The InterfaceComment object representing the comment to delete.

## Returns

`Promise`\<`void`\>

A promise resolving to void.

## Defined in

[src/services/CommentCache/deleteCommentFromCache.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/CommentCache/deleteCommentFromCache.ts#L10)
