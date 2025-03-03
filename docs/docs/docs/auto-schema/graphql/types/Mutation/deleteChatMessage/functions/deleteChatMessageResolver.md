[Admin Docs](/)

***

# Function: deleteChatMessageResolver()

> **deleteChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `[key: string]`: `any`;  `id`: `unknown`; \} = `mutationDeleteChatMessageInputSchema`

#### input.id

`unknown` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>

## Defined in

[src/graphql/types/Mutation/deleteChatMessage.ts:17](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/graphql/types/Mutation/deleteChatMessage.ts#L17)
