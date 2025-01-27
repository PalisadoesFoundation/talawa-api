[**talawa-api**](../../../../README.md)

***

# Function: ancestorTags()

> **ancestorTags**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>[]\>

Resolver function for the `ancestorTags` field of an `OrganizationTagUser`.

This function retrieves the ancestor tags of a specific organization user tag by recursively finding
each parent tag until the root tag (where parentTagId is null) is reached. It then reverses the order,
appends the current tag at the end, and returns the final array of tags.

## Parameters

### parent

[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)

The parent object representing the user tag. It contains information about the tag, including its ID and parentTagId.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>[]\>

A promise that resolves to the ordered array of ancestor tag documents found in the database.

## Defined in

[src/resolvers/UserTag/ancestorTags.ts:15](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/UserTag/ancestorTags.ts#L15)
