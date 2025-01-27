[**talawa-api**](../../../README.md)

***

# Type Alias: UserTagResolvers\<ContextType, ParentType\>

> **UserTagResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserTag"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserTag"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### \_id?

> `optional` **\_id**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`\>

### ancestorTags?

> `optional` **ancestorTags**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>[]\>, `ParentType`, `ContextType`\>

### childTags?

> `optional` **childTags**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTagsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`UserTagChildTagsArgs`](UserTagChildTagsArgs.md)\>\>

### name?

> `optional` **name**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\], `ParentType`, `ContextType`\>

### organization?

> `optional` **organization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>, `ParentType`, `ContextType`\>

### parentTag?

> `optional` **parentTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`\>

### usersAssignedTo?

> `optional` **usersAssignedTo**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UsersConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`UserTagUsersAssignedToArgs`](UserTagUsersAssignedToArgs.md)\>\>

### usersToAssignTo?

> `optional` **usersToAssignTo**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UsersConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`UserTagUsersToAssignToArgs`](UserTagUsersToAssignToArgs.md)\>\>

## Defined in

[src/types/generatedGraphQLTypes.ts:5057](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/types/generatedGraphQLTypes.ts#L5057)
