[**talawa-api**](../../../README.md)

***

# Type Alias: OrganizationResolvers\<ContextType, ParentType\>

> **OrganizationResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Organization"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Organization"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### \_id?

> `optional` **\_id**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`\>

### actionItemCategories?

> `optional` **actionItemCategories**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItemCategory"`\]\>[]\>, `ParentType`, `ContextType`\>

### address?

> `optional` **address**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Address"`\]\>, `ParentType`, `ContextType`\>

### admins?

> `optional` **admins**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\][]\>, `ParentType`, `ContextType`, `Partial`\<[`OrganizationAdminsArgs`](OrganizationAdminsArgs.md)\>\>

### advertisements?

> `optional` **advertisements**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AdvertisementsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`OrganizationAdvertisementsArgs`](OrganizationAdvertisementsArgs.md)\>\>

### agendaCategories?

> `optional` **agendaCategories**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaCategory"`\]\>[]\>, `ParentType`, `ContextType`\>

### apiUrl?

> `optional` **apiUrl**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"URL"`\], `ParentType`, `ContextType`\>

### blockedUsers?

> `optional` **blockedUsers**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\]\>[]\>, `ParentType`, `ContextType`\>

### createdAt?

> `optional` **createdAt**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DateTime"`\], `ParentType`, `ContextType`\>

### creator?

> `optional` **creator**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\]\>, `ParentType`, `ContextType`\>

### customFields?

> `optional` **customFields**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"OrganizationCustomField"`\][], `ParentType`, `ContextType`\>

### description?

> `optional` **description**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\], `ParentType`, `ContextType`\>

### funds?

> `optional` **funds**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Fund"`\]\>[]\>, `ParentType`, `ContextType`\>

### image?

> `optional` **image**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\]\>, `ParentType`, `ContextType`\>

### members?

> `optional` **members**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\]\>[]\>, `ParentType`, `ContextType`\>

### membershipRequests?

> `optional` **membershipRequests**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MembershipRequest"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`OrganizationMembershipRequestsArgs`](OrganizationMembershipRequestsArgs.md)\>\>

### name?

> `optional` **name**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\], `ParentType`, `ContextType`\>

### pinnedPosts?

> `optional` **pinnedPosts**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\]\>[]\>, `ParentType`, `ContextType`\>

### posts?

> `optional` **posts**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PostsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`OrganizationPostsArgs`](OrganizationPostsArgs.md)\>\>

### updatedAt?

> `optional` **updatedAt**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DateTime"`\], `ParentType`, `ContextType`\>

### userRegistrationRequired?

> `optional` **userRegistrationRequired**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### userTags?

> `optional` **userTags**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTagsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`OrganizationUserTagsArgs`](OrganizationUserTagsArgs.md)\>\>

### venues?

> `optional` **venues**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Venue"`\]\>[]\>, `ParentType`, `ContextType`\>

### visibleInSearch?

> `optional` **visibleInSearch**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4708](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/types/generatedGraphQLTypes.ts#L4708)
