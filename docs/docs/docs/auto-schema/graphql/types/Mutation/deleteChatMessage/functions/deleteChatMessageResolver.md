[Admin Docs](/)

***

# Function: deleteChatMessageResolver()

> **deleteChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Mutation/deleteChatMessage.ts:17](https://github.com/Suyash878/talawa-api/blob/3646aad880eea5a7cfb665aa9031a4d873c30798/src/graphql/types/Mutation/deleteChatMessage.ts#L17)

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
