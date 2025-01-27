[**talawa-api**](../../../../README.md)

***

# Function: actionItemCategoriesByOrganization()

> **actionItemCategoriesByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[]\>

This query will fetch all categories for the organization from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryActionItemCategoriesByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryActionItemCategoriesByOrganizationArgs.md), `"organizationId"`\>

An object that contains `organizationId` which is the _id of the Organization and `orderBy` which is the sorting order & where which is the filter.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[]\>

A `categories` object that holds all categories for the Organization.

## Defined in

[src/resolvers/Query/actionItemCategoriesByOrganization.ts:11](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/actionItemCategoriesByOrganization.ts#L11)
