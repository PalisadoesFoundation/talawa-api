[**talawa-api**](../../../README.md)

***

# Type Alias: Organization

> **Organization**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"Organization"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### actionItemCategories?

> `optional` **actionItemCategories**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItemCategory`](ActionItemCategory.md)\>[]\>

### address?

> `optional` **address**: [`Maybe`](Maybe.md)\<[`Address`](Address.md)\>

### admins?

> `optional` **admins**: [`Maybe`](Maybe.md)\<[`User`](User.md)[]\>

### advertisements?

> `optional` **advertisements**: [`Maybe`](Maybe.md)\<[`AdvertisementsConnection`](AdvertisementsConnection.md)\>

### agendaCategories?

> `optional` **agendaCategories**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaCategory`](AgendaCategory.md)\>[]\>

### apiUrl

> **apiUrl**: [`Scalars`](Scalars.md)\[`"URL"`\]\[`"output"`\]

### blockedUsers?

> `optional` **blockedUsers**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### customFields

> **customFields**: [`OrganizationCustomField`](OrganizationCustomField.md)[]

### description

> **description**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### funds?

> `optional` **funds**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Fund`](Fund.md)\>[]\>

### image?

> `optional` **image**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### members?

> `optional` **members**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### membershipRequests?

> `optional` **membershipRequests**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`MembershipRequest`](MembershipRequest.md)\>[]\>

### name

> **name**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### pinnedPosts?

> `optional` **pinnedPosts**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Post`](Post.md)\>[]\>

### posts?

> `optional` **posts**: [`Maybe`](Maybe.md)\<[`PostsConnection`](PostsConnection.md)\>

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### userRegistrationRequired

> **userRegistrationRequired**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### userTags?

> `optional` **userTags**: [`Maybe`](Maybe.md)\<[`UserTagsConnection`](UserTagsConnection.md)\>

### venues?

> `optional` **venues**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Venue`](Venue.md)\>[]\>

### visibleInSearch

> **visibleInSearch**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

## Defined in

[src/types/generatedGraphQLTypes.ts:2038](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/types/generatedGraphQLTypes.ts#L2038)
