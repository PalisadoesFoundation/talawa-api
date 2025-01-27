[**talawa-api**](../../../README.md)

***

# Type Alias: UserResolvers\<ContextType, ParentType\>

> **UserResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### \_id?

> `optional` **\_id**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`\>

### address?

> `optional` **address**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Address"`\]\>, `ParentType`, `ContextType`\>

### appUserProfileId?

> `optional` **appUserProfileId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AppUserProfile"`\]\>, `ParentType`, `ContextType`\>

### birthDate?

> `optional` **birthDate**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Date"`\]\>, `ParentType`, `ContextType`\>

### createdAt?

> `optional` **createdAt**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DateTime"`\], `ParentType`, `ContextType`\>

### educationGrade?

> `optional` **educationGrade**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EducationGrade"`\]\>, `ParentType`, `ContextType`\>

### email?

> `optional` **email**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EmailAddress"`\], `ParentType`, `ContextType`\>

### employmentStatus?

> `optional` **employmentStatus**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EmploymentStatus"`\]\>, `ParentType`, `ContextType`\>

### eventAdmin?

> `optional` **eventAdmin**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`\>

### eventsAttended?

> `optional` **eventsAttended**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`\>

### file?

> `optional` **file**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"File"`\]\>, `ParentType`, `ContextType`\>

### firstName?

> `optional` **firstName**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\], `ParentType`, `ContextType`\>

### gender?

> `optional` **gender**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Gender"`\]\>, `ParentType`, `ContextType`\>

### identifier?

> `optional` **identifier**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Int"`\], `ParentType`, `ContextType`\>

### image?

> `optional` **image**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\]\>, `ParentType`, `ContextType`\>

### joinedOrganizations?

> `optional` **joinedOrganizations**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>[]\>, `ParentType`, `ContextType`\>

### lastName?

> `optional` **lastName**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\], `ParentType`, `ContextType`\>

### maritalStatus?

> `optional` **maritalStatus**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MaritalStatus"`\]\>, `ParentType`, `ContextType`\>

### membershipRequests?

> `optional` **membershipRequests**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MembershipRequest"`\]\>[]\>, `ParentType`, `ContextType`\>

### organizationsBlockedBy?

> `optional` **organizationsBlockedBy**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>[]\>, `ParentType`, `ContextType`\>

### phone?

> `optional` **phone**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserPhone"`\]\>, `ParentType`, `ContextType`\>

### pluginCreationAllowed?

> `optional` **pluginCreationAllowed**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### posts?

> `optional` **posts**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PostsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`UserPostsArgs`](UserPostsArgs.md)\>\>

### registeredEvents?

> `optional` **registeredEvents**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`\>

### tagsAssignedWith?

> `optional` **tagsAssignedWith**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTagsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`UserTagsAssignedWithArgs`](UserTagsAssignedWithArgs.md)\>\>

### updatedAt?

> `optional` **updatedAt**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DateTime"`\], `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4975](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/types/generatedGraphQLTypes.ts#L4975)
