[**talawa-api**](../../../../README.md)

***

# Function: createChat()

> **createChat**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

This function enables to create a chat.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateChatArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateChatArgs.md), `"data"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

Created chat

## Remarks

The following checks are done:
1. If the user exists
2. If the organization exists

## Defined in

[src/resolvers/Mutation/createChat.ts:19](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/createChat.ts#L19)
