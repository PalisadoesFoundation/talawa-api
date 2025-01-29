[Admin Docs](/)

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

[src/types/generatedGraphQLTypes.ts:295](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L295)
