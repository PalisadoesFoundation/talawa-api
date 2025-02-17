[Admin Docs](/)

***

# Function: updateAgendaItemResolver()

> **updateAgendaItemResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `description`: `string`; `duration`: `string`; `folderId`: `string`; `id`: `string`; `key`: `string`; `name`: `string`; `type`: `"general"` \| `"note"` \| `"scripture"` \| `"song"`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/graphql/types/Mutation/updateAgendaItem.ts:18](https://github.com/Suyash878/talawa-api/blob/3646aad880eea5a7cfb665aa9031a4d873c30798/src/graphql/types/Mutation/updateAgendaItem.ts#L18)

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `description`: `string`; `duration`: `string`; `folderId`: `string`; `id`: `string`; `key`: `string`; `name`: `string`; \}

#### input.description?

`string`

#### input.duration?

`string`

#### input.folderId?

`string`

#### input.id

`string`

#### input.key?

`string`

#### input.name?

`string`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `description`: `string`; `duration`: `string`; `folderId`: `string`; `id`: `string`; `key`: `string`; `name`: `string`; `type`: `"general"` \| `"note"` \| `"scripture"` \| `"song"`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>
