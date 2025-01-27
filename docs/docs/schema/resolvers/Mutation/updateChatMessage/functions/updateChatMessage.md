[**talawa-api**](../../../../README.md)

***

# Function: updateChatMessage()

> **updateChatMessage**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>\>

This function enables to update a chat message.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateChatMessageArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateChatMessageArgs.md), `"input"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>\>

Updated chat message.

## Remarks

The following checks are done:
1. If the chat message exists.
2. If the chat exists.
3. If the user exists.
4. If the user is a member of the chat.
5. If the user is the sender of the message.

## Defined in

[src/resolvers/Mutation/updateChatMessage.ts:28](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/updateChatMessage.ts#L28)
