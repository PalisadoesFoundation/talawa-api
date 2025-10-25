[Admin Docs](/)

***

# Function: resolveActionItemsPaginated()

> **resolveActionItemsPaginated**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `null` \| `string`; `categoryId`: `null` \| `string`; `completionAt`: `null` \| `Date`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `null` \| `string`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `null` \| `boolean`; `organizationId`: `string`; `postCompletionNotes`: `null` \| `string`; `preCompletionNotes`: `null` \| `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>\>

Defined in: [src/graphql/types/Event/actionItems.ts:59](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/graphql/types/Event/actionItems.ts#L59)

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
