[API Docs](/)

***

# Function: resolveItems()

> **resolveItems**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/graphqlConnection/types/type-aliases/DefaultGraphQLConnection.md)\<\{ `categoryId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `duration`: `string` \| `null`; `eventId`: `string`; `folderId`: `string`; `id`: `string`; `key`: `string` \| `null`; `name`: `string`; `notes`: `string` \| `null`; `sequence`: `number`; `type`: `"general"` \| `"note"` \| `"scripture"` \| `"song"`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>\>

Defined in: [src/graphql/types/AgendaFolder/items.ts:54](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/AgendaFolder/items.ts#L54)

## Parameters

### parent

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### description

`string` \| `null`

#### eventId

`string`

#### id

`string`

#### isAgendaItemFolder

`boolean`

#### isDefaultFolder

`boolean`

#### name

`string`

#### organizationId

`string`

#### parentFolderId

`string` \| `null`

#### sequence

`number` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

### args

`unknown`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/graphqlConnection/types/type-aliases/DefaultGraphQLConnection.md)\<\{ `categoryId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `duration`: `string` \| `null`; `eventId`: `string`; `folderId`: `string`; `id`: `string`; `key`: `string` \| `null`; `name`: `string`; `notes`: `string` \| `null`; `sequence`: `number`; `type`: `"general"` \| `"note"` \| `"scripture"` \| `"song"`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>\>
