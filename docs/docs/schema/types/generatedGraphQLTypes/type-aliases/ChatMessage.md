[**talawa-api**](../../../README.md)

***

# Type Alias: ChatMessage

> **ChatMessage**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"ChatMessage"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### chatMessageBelongsTo

> **chatMessageBelongsTo**: [`Chat`](Chat.md)

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### deletedBy?

> `optional` **deletedBy**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### media?

> `optional` **media**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### messageContent

> **messageContent**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### replyTo?

> `optional` **replyTo**: [`Maybe`](Maybe.md)\<[`ChatMessage`](ChatMessage.md)\>

### sender

> **sender**: [`User`](User.md)

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

## Defined in

[src/types/generatedGraphQLTypes.ts:295](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L295)
