[**talawa-api**](../../../../README.md)

***

# Function: messages()

> **messages**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>[]\>

This resolver function will fetch and return the list of all messages in specified Chat from database.

## Parameters

### parent

[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)

An object that is the return value of the resolver for this field's parent.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>[]\>

An `object` that contains the list of messages.

## Defined in

[src/resolvers/Chat/messages.ts:8](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Chat/messages.ts#L8)
