[Admin Docs](/)

***

# Type Alias: SubscriptionResolvers\<ContextType, ParentType\>

> **SubscriptionResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Subscription"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Subscription"`\]

## Type declaration

### messageSentToChat?

> `optional` **messageSentToChat**: [`SubscriptionResolver`](SubscriptionResolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ChatMessage"`\]\>, `"messageSentToChat"`, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`SubscriptionMessageSentToChatArgs`](SubscriptionMessageSentToChatArgs.md), `"userId"`\>\>

### onPluginUpdate?

> `optional` **onPluginUpdate**: [`SubscriptionResolver`](SubscriptionResolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Plugin"`\]\>, `"onPluginUpdate"`, `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4935](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L4935)
