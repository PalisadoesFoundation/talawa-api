[**talawa-api**](../../../README.md)

***

# Type Alias: UserPhoneResolvers\<ContextType, ParentType\>

> **UserPhoneResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserPhone"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserPhone"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### home?

> `optional` **home**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PhoneNumber"`\]\>, `ParentType`, `ContextType`\>

### mobile?

> `optional` **mobile**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PhoneNumber"`\]\>, `ParentType`, `ContextType`\>

### work?

> `optional` **work**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PhoneNumber"`\]\>, `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:5050](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L5050)
