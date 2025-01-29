[**talawa-api**](../../../../README.md)

***

# Function: sendMessageToChat()

> **sendMessageToChat**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>\>

This function enables to send message to chat.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationSendMessageToChatArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationSendMessageToChatArgs.md), `"chatId"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>\>

Chat message.

## Remarks

The following checks are done:
1. If the direct chat exists.
2. If the user exists

## Defined in

[src/resolvers/Mutation/sendMessageToChat.ts:17](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/sendMessageToChat.ts#L17)
