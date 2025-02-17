[Admin Docs](/)

***

# Function: updateAgendaItemResolver()

> **updateAgendaItemResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string`; `description`: `string`; `duration`: `string`; `folderId`: `string`; `id`: `string`; `key`: `string`; `name`: `string`; `type`: `"general"` \| `"note"` \| `"scripture"` \| `"song"`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/graphql/types/Mutation/updateAgendaItem.ts:18](https://github.com/Suyash878/talawa-api/blob/0d5834ec7c0ad3d008c3a8e58fbf32c7824b9122/src/graphql/types/Mutation/updateAgendaItem.ts#L18)

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
