[API Docs](/)

***

# Function: deleteChatMessageResolver()

> **deleteChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `id`: `string`; `parentMessageId`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \}\>

Defined in: src/graphql/types/Mutation/deleteChatMessage.ts:24

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `id`: `string`; \} = `mutationDeleteChatMessageInputSchema`

#### input.id

`string` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `id`: `string`; `parentMessageId`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \}\>
