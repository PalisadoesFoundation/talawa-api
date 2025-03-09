[Admin Docs](/)

***

# Function: deleteChatMessageResolver()

> **deleteChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Mutation/deleteChatMessage.ts:17](https://github.com/syedali237/talawa-api/blob/691786dc98e76819737c41ef0af34983792105fd/src/graphql/types/Mutation/deleteChatMessage.ts#L17)

## Parameters

### \_parent

`unknown`

### args

#### input?

\{ `[key: string]`: `any`;  `id`: `unknown`; \} = `mutationDeleteChatMessageInputSchema`

#### input.id?

`unknown` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>
