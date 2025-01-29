[**talawa-api**](../../../README.md)

***

# Type Alias: CreateCommentPayloadResolvers\<ContextType, ParentType\>

> **CreateCommentPayloadResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"CreateCommentPayload"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"CreateCommentPayload"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### comment?

> `optional` **comment**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Comment"`\]\>, `ParentType`, `ContextType`\>

### userErrors?

> `optional` **userErrors**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"CreateCommentError"`\][], `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4226](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L4226)
