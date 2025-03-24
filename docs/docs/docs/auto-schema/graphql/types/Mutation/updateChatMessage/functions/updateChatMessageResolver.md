[Admin Docs](/)

***

# Function: updateChatMessageResolver()

> **updateChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Mutation/updateChatMessage.ts:19](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/graphql/types/Mutation/updateChatMessage.ts#L19)

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `body`: `string`; `id`: `string`; \}

#### input.body

`string`

#### input.id

`string`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>
