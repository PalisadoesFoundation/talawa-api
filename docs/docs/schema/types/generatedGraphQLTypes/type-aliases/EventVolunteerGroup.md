[**talawa-api**](../../../README.md)

***

# Type Alias: EventVolunteerGroup

> **EventVolunteerGroup**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"EventVolunteerGroup"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### assignments?

> `optional` **assignments**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItem`](ActionItem.md)\>[]\>

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### description?

> `optional` **description**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### event?

> `optional` **event**: [`Maybe`](Maybe.md)\<[`Event`](Event.md)\>

### leader

> **leader**: [`User`](User.md)

### name?

> `optional` **name**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### volunteers?

> `optional` **volunteers**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`EventVolunteer`](EventVolunteer.md)\>[]\>

### volunteersRequired?

> `optional` **volunteersRequired**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Int"`\]\[`"output"`\]\>

## Defined in

[src/types/generatedGraphQLTypes.ts:854](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/types/generatedGraphQLTypes.ts#L854)
