[Admin Docs](/)

***

# Function: markChatMessagesAsRead()

> **markChatMessagesAsRead**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

This function enables to send message to direct chat.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationMarkChatMessagesAsReadArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationMarkChatMessagesAsReadArgs.md), `"userId"` \| `"chatId"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

Direct chat message.

## Remarks

The following checks are done:
1. If the direct chat exists.
2. If the user exists

## Defined in

[src/resolvers/Mutation/markChatMessagesAsRead.ts:20](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/markChatMessagesAsRead.ts#L20)
