[**talawa-api**](../../../../README.md)

***

# Function: actionItemCategories()

> **actionItemCategories**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[]\>

Resolver function for the `actionItemCategories` field of an `Organization`.

This function retrieves the action item categories related to a specific organization.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the ID of the organization.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)\>[]\>

A promise that resolves to the action item category documents found in the database. These documents represent the action item categories related to the organization.

## See

 - ActionItemCategory - The ActionItemCategory model used to interact with the action item categories collection in the database.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/actionItemCategories.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Organization/actionItemCategories.ts#L16)
