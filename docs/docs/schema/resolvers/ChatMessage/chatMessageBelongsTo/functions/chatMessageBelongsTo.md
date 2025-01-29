[Admin Docs](/)

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

[src/resolvers/ChatMessage/chatMessageBelongsTo.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/ChatMessage/chatMessageBelongsTo.ts#L10)
