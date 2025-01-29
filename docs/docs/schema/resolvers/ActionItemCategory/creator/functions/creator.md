[**talawa-api**](../../../../README.md)

***

# Function: creator()

> **creator**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Resolver function for the `creator` field of an `ActionItemCategory`.

This function retrieves the user who created a specific action item category.

## Parameters

### parent

[`InterfaceActionItemCategory`](../../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)

The parent object representing the action item category. It contains information about the action item category, including the ID of the user who created it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

A promise that resolves to the user document found in the database. This document represents the user who created the action item category.

## See

 - User - The User model used to interact with the users collection in the database.
 - ActionItemCategoryResolvers - The type definition for the resolvers of the ActionItemCategory fields.

## Defined in

[src/resolvers/ActionItemCategory/creator.ts:15](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/ActionItemCategory/creator.ts#L15)
