[Admin Docs](/)

***

# Function: deleteChatMessageResolver()

> **deleteChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `id`: `string`; `parentMessageId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [src/graphql/types/Mutation/deleteChatMessage.ts:23](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/types/Mutation/deleteChatMessage.ts#L23)

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
