[Admin Docs](/)

***

# Function: deleteChatMessageResolver()

> **deleteChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `id`: `string`; `parentMessageId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [src/graphql/types/Mutation/deleteChatMessage.ts:23](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/types/Mutation/deleteChatMessage.ts#L23)

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

`Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `id`: `string`; `parentMessageId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; \}\>
