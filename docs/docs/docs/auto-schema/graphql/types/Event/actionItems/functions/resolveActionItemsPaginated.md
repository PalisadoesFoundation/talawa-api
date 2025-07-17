[Admin Docs](/)

***

# Function: resolveActionItemsPaginated()

> **resolveActionItemsPaginated**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `string`; `categoryId`: `string`; `completionAt`: `Date`; `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `isCompleted`: `boolean`; `organizationId`: `string`; `postCompletionNotes`: `string`; `preCompletionNotes`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>\>

Defined in: [src/graphql/types/Event/actionItems.ts:58](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/types/Event/actionItems.ts#L58)

## Parameters

### parent

[`Event`](../../Event/type-aliases/Event.md)

### args

#### after?

`string` = `...`

#### before?

`string` = `...`

#### first?

`number` = `...`

#### last?

`number` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `string`; `categoryId`: `string`; `completionAt`: `Date`; `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `isCompleted`: `boolean`; `organizationId`: `string`; `postCompletionNotes`: `string`; `preCompletionNotes`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>\>
