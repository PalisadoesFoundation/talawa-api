[**talawa-api**](../../../../README.md)

***

# Function: blockedUsers()

> **blockedUsers**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[]\>

Resolver function for the `blockedUsers` field of an `Organization`.

This function retrieves the users who are blocked by a specific organization.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the IDs of the users who are blocked.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[]\>

A promise that resolves to an array of user documents found in the database. These documents represent the users who are blocked by the organization.

## See

 - User - The User model used to interact with the users collection in the database.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/blockedUsers.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Organization/blockedUsers.ts#L16)
