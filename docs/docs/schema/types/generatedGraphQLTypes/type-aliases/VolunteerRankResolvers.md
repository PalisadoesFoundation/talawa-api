[Admin Docs](/)

***

# Type Alias: VolunteerRankResolvers\<ContextType, ParentType\>

> **VolunteerRankResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"VolunteerRank"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"VolunteerRank"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### hoursVolunteered?

> `optional` **hoursVolunteered**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Float"`\], `ParentType`, `ContextType`\>

### rank?

> `optional` **rank**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Int"`\], `ParentType`, `ContextType`\>

### user?

> `optional` **user**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:5118](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L5118)
