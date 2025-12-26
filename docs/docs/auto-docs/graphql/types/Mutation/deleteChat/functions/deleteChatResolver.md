[API Docs](/)

***

# Function: deleteChatResolver()

> **deleteChatResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `avatarMimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `null`; `avatarName`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `organizationId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: [src/graphql/types/Mutation/deleteChat.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Mutation/deleteChat.ts#L18)

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `id`: `string`; \} = `mutationDeleteChatInputSchema`

#### input.id

`string` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `avatarMimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `null`; `avatarName`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `organizationId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>
