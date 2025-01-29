[**talawa-api**](../../../README.md)

***

# Type Alias: Comment

> **Comment**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"Comment"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### likeCount?

> `optional` **likeCount**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Int"`\]\[`"output"`\]\>

### likedBy?

> `optional` **likedBy**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### post

> **post**: [`Post`](Post.md)

### text

> **text**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

## Defined in

[src/types/generatedGraphQLTypes.ts:345](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/types/generatedGraphQLTypes.ts#L345)
