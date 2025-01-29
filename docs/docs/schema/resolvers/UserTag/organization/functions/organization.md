[**talawa-api**](../../../../README.md)

***

# Function: organization()

> **organization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

Resolver function for the `organization` field of a `UserTag`.

This function retrieves the organization associated with a specific user tag.

## Parameters

### parent

[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)

The parent object representing the user tag. It contains information about the user tag, including the ID of the organization associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

A promise that resolves to the organization document found in the database. This document represents the organization associated with the user tag.

## See

 - Organization - The Organization model used to interact with the organizations collection in the database.
 - UserTagResolvers - The type definition for the resolvers of the UserTag fields.

## Defined in

[src/resolvers/UserTag/organization.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/UserTag/organization.ts#L16)
