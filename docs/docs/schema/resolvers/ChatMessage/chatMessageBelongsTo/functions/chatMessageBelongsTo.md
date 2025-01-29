[**talawa-api**](../../../../README.md)

***

# Function: chatMessageBelongsTo()

> **chatMessageBelongsTo**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

This resolver method will retrieve and return from the database the Chat to which the specified message belongs.

## Parameters

### parent

[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)

An object that is the return value of the resolver for this field's parent.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

An `object` that contains the Chat data.

## Defined in

[src/resolvers/ChatMessage/chatMessageBelongsTo.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/ChatMessage/chatMessageBelongsTo.ts#L10)
