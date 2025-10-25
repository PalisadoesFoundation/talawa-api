[Admin Docs](/)

***

# Function: resolveActionItemsPaginated()

> **resolveActionItemsPaginated**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `null` \| `string`; `categoryId`: `null` \| `string`; `completionAt`: `null` \| `Date`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `null` \| `string`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `null` \| `boolean`; `organizationId`: `string`; `postCompletionNotes`: `null` \| `string`; `preCompletionNotes`: `null` \| `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>\>

Defined in: [src/graphql/types/Event/actionItems.ts:59](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/graphql/types/Event/actionItems.ts#L59)

## Parameters

### parent

[`Event`](../../Event/type-aliases/Event.md)

### args

#### after?

`null` \| `string` = `...`

#### before?

`null` \| `string` = `...`

#### first?

`null` \| `number` = `...`

#### last?

`null` \| `number` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `null` \| `string`; `categoryId`: `null` \| `string`; `completionAt`: `null` \| `Date`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `null` \| `string`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `null` \| `boolean`; `organizationId`: `string`; `postCompletionNotes`: `null` \| `string`; `preCompletionNotes`: `null` \| `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>\>
