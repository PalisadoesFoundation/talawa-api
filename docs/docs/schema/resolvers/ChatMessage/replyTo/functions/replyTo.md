[**talawa-api**](../../../../README.md)

***

# Function: replyTo()

> **replyTo**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>\>

This resolver function will fetch and return the message replied to specific to the chat from the database.

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

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChatMessage`](../../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)\>\>

An `object` that contains reply Message's data.

## Defined in

[src/resolvers/ChatMessage/replyTo.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/ChatMessage/replyTo.ts#L10)
