[**talawa-api**](../../../../README.md)

***

# Function: organization()

> **organization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

Resolver function for the `organization` field of a `MembershipRequest`.

This function retrieves the organization associated with a specific membership request.

## Parameters

### parent

[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)

The parent object representing the membership request. It contains information about the membership request, including the ID of the organization it is associated with.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

A promise that resolves to the organization document found in the database. This document represents the organization associated with the membership request.

## See

 - Organization - The Organization model used to interact with the organizations collection in the database.
 - MembershipRequestResolvers - The type definition for the resolvers of the MembershipRequest fields.

## Defined in

[src/resolvers/MembershipRequest/organization.ts:18](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/MembershipRequest/organization.ts#L18)
