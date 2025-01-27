[**talawa-api**](../../../README.md)

***

# Type Alias: Chat

> **Chat**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"Chat"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### admins?

> `optional` **admins**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### image?

> `optional` **image**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### isGroup

> **isGroup**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### lastMessageId?

> `optional` **lastMessageId**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### messages?

> `optional` **messages**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ChatMessage`](ChatMessage.md)\>[]\>

### name?

> `optional` **name**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### organization?

> `optional` **organization**: [`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>

### unseenMessagesByUsers?

> `optional` **unseenMessagesByUsers**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"JSON"`\]\[`"output"`\]\>

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### users

> **users**: [`User`](User.md)[]

## Defined in

[src/types/generatedGraphQLTypes.ts:278](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/types/generatedGraphQLTypes.ts#L278)
