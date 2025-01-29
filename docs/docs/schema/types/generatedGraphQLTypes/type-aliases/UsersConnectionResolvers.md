[**talawa-api**](../../../README.md)

***

# Type Alias: UsersConnectionResolvers\<ContextType, ParentType\>

> **UsersConnectionResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UsersConnection"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UsersConnection"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### edges?

> `optional` **edges**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UsersConnectionEdge"`\][], `ParentType`, `ContextType`\>

### pageInfo?

> `optional` **pageInfo**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DefaultConnectionPageInfo"`\], `ParentType`, `ContextType`\>

### totalCount?

> `optional` **totalCount**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Int"`\]\>, `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:5082](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/types/generatedGraphQLTypes.ts#L5082)
