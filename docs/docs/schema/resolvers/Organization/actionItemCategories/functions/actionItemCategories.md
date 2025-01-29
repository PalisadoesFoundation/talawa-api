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

[src/resolvers/Organization/actionItemCategories.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Organization/actionItemCategories.ts#L16)
