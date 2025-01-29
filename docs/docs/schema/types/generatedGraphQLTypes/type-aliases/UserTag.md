[**talawa-api**](../../../README.md)

***

# Type Alias: UserTag

> **UserTag**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"UserTag"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

A field to get the mongodb object id identifier for this UserTag.

### ancestorTags?

> `optional` **ancestorTags**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>[]\>

A field to traverse the ancestor tags of this UserTag.

### childTags?

> `optional` **childTags**: [`Maybe`](Maybe.md)\<[`UserTagsConnection`](UserTagsConnection.md)\>

A connection field to traverse a list of UserTag this UserTag is a
parent to.

### name

> **name**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

A field to get the name of this UserTag.

### organization?

> `optional` **organization**: [`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>

A field to traverse the Organization that created this UserTag.

### parentTag?

> `optional` **parentTag**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

A field to traverse the parent UserTag of this UserTag.

### usersAssignedTo?

> `optional` **usersAssignedTo**: [`Maybe`](Maybe.md)\<[`UsersConnection`](UsersConnection.md)\>

A connection field to traverse a list of User this UserTag is assigned
to.

### usersToAssignTo?

> `optional` **usersToAssignTo**: [`Maybe`](Maybe.md)\<[`UsersConnection`](UsersConnection.md)\>

A connection field to traverse a list of Users this UserTag is not assigned
to, to see and select among them and assign this tag.

## Defined in

[src/types/generatedGraphQLTypes.ts:3171](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L3171)
