[API Docs](/)

***

# Function: resolveActionItemsPaginated()

> **resolveActionItemsPaginated**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `categoryId`: `null` \| `string`; `completionAt`: `null` \| `Date`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `null` \| `string`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `null` \| `boolean`; `organizationId`: `string`; `postCompletionNotes`: `null` \| `string`; `preCompletionNotes`: `null` \| `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `volunteerGroupId`: `null` \| `string`; `volunteerId`: `null` \| `string`; \}\>\>

Defined in: [src/graphql/types/Event/actionItems.ts:59](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Event/actionItems.ts#L59)

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

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `categoryId`: `null` \| `string`; `completionAt`: `null` \| `Date`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `eventId`: `null` \| `string`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `null` \| `boolean`; `organizationId`: `string`; `postCompletionNotes`: `null` \| `string`; `preCompletionNotes`: `null` \| `string`; `recurringEventInstanceId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `volunteerGroupId`: `null` \| `string`; `volunteerId`: `null` \| `string`; \}\>\>
