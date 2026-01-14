[**talawa-api**](../../../../../README.md)

***

# Function: resolveUpdatedAt()

> **resolveUpdatedAt**(`parent`, `_args`, `ctx`): `Promise`\<`Date` \| `null`\>

Defined in: [src/graphql/types/AgendaFolder/updatedAt.ts:17](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/AgendaFolder/updatedAt.ts#L17)

Resolver function for the AgendaFolder.updatedAt field.
Exported for testing purposes.

## Parameters

### parent

The parent AgendaFolder object

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### eventId

`string`

#### id

`string`

#### isAgendaItemFolder

`boolean`

#### name

`string`

#### parentFolderId

`string` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

### \_args

`unknown`

GraphQL arguments (unused)

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

GraphQL context with authentication and database access

## Returns

`Promise`\<`Date` \| `null`\>

- The updatedAt timestamp of the agenda folder

## Throws

TalawaGraphQLError When user is not authenticated or unauthorized
