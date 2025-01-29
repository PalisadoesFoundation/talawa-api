[**talawa-api**](../../../README.md)

***

# Type Alias: UserDataResolvers\<ContextType, ParentType\>

> **UserDataResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserData"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserData"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### appUserProfile?

> `optional` **appUserProfile**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AppUserProfile"`\]\>, `ParentType`, `ContextType`\>

### user?

> `optional` **user**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:5020](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L5020)
