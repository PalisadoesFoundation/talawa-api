[Admin Docs](/)

***

# Function: resolveActionItemsPaginated()

> **resolveActionItemsPaginated**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `null` \| `string`; `categoryId`: `null` \| `string`; `completionAt`: `null` \| `Date`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `null` \| `string`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `null` \| `boolean`; `organizationId`: `string`; `postCompletionNotes`: `null` \| `string`; `preCompletionNotes`: `null` \| `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>\>

Defined in: [src/graphql/types/Event/actionItems.ts:59](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Event/actionItems.ts#L59)

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
