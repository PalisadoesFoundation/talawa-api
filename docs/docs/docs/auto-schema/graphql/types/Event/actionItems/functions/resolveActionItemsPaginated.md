[Admin Docs](/)

***

# Function: resolveActionItemsPaginated()

> **resolveActionItemsPaginated**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `assignedAt`: `Date`; `assigneeId`: `string`; `categoryId`: `string`; `completionAt`: `Date`; `createdAt`: `Date`; `creatorId`: `string`; `eventId`: `string`; `id`: `string`; `isCompleted`: `boolean`; `organizationId`: `string`; `postCompletionNotes`: `string`; `preCompletionNotes`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>\>

Defined in: [src/graphql/types/Event/actionItems.ts:58](https://github.com/gautam-divyanshu/talawa-api/blob/a895c36f24acf725ac16aa7e0f8e50ef9fa64c42/src/graphql/types/Event/actionItems.ts#L58)

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
