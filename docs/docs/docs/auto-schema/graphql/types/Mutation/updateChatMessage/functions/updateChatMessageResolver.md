[Admin Docs](/)

***

# Function: updateChatMessageResolver()

> **updateChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `id`: `string`; `parentMessageId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [src/graphql/types/Mutation/updateChatMessage.ts:19](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/types/Mutation/updateChatMessage.ts#L19)

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

`Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `id`: `string`; `parentMessageId`: `null` \| `string`; `updatedAt`: `null` \| `Date`; \}\>
