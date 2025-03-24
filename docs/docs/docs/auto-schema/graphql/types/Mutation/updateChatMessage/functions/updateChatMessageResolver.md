[Admin Docs](/)

***

# Function: updateChatMessageResolver()

> **updateChatMessageResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `body`: `string`; `chatId`: `string`; `createdAt`: `Date`; `creatorId`: `string`; `id`: `string`; `parentMessageId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Mutation/updateChatMessage.ts:19](https://github.com/NishantSinghhhhh/talawa-api/blob/c589e7bc1eb842c2fd40f1d8b61882c5c36978fe/src/graphql/types/Mutation/updateChatMessage.ts#L19)

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
