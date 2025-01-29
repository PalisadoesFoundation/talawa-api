[**talawa-api**](../../../README.md)

***

# Type Alias: AgendaSection

> **AgendaSection**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"AgendaSection"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### createdBy?

> `optional` **createdBy**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### description

> **description**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### items?

> `optional` **items**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>[]\>

### relatedEvent?

> `optional` **relatedEvent**: [`Maybe`](Maybe.md)\<[`Event`](Event.md)\>

### sequence

> **sequence**: [`Scalars`](Scalars.md)\[`"Int"`\]\[`"output"`\]

### updatedAt?

> `optional` **updatedAt**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]\>

### updatedBy?

> `optional` **updatedBy**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

## Defined in

[src/types/generatedGraphQLTypes.ts:217](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L217)
