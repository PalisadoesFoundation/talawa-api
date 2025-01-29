[**talawa-api**](../../../README.md)

***

# Type Alias: UserFamilyResolvers\<ContextType, ParentType\>

> **UserFamilyResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserFamily"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserFamily"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### \_id?

> `optional` **\_id**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`\>

### admins?

> `optional` **admins**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\][], `ParentType`, `ContextType`\>

### creator?

> `optional` **creator**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`\>

### title?

> `optional` **title**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\]\>, `ParentType`, `ContextType`\>

### users?

> `optional` **users**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\][], `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:5026](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L5026)
