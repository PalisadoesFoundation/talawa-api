[**talawa-api**](../../../README.md)

***

# Type Alias: VolunteerMembership

> **VolunteerMembership**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"VolunteerMembership"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### createdBy?

> `optional` **createdBy**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### event

> **event**: [`Event`](Event.md)

### group?

> `optional` **group**: [`Maybe`](Maybe.md)\<[`EventVolunteerGroup`](EventVolunteerGroup.md)\>

### status

> **status**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### updatedBy?

> `optional` **updatedBy**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### volunteer

> **volunteer**: [`EventVolunteer`](EventVolunteer.md)

## Defined in

[src/types/generatedGraphQLTypes.ts:3348](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L3348)
