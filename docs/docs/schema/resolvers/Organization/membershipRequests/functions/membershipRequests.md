[**talawa-api**](../../../../README.md)

***

# Function: membershipRequests()

> **membershipRequests**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\>[]\>

Resolver function for the `membershipRequests` field of an `Organization`.

This function retrieves the membership requests related to a specific organization.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the IDs of the membership requests.

### args

`Partial`\<[`OrganizationMembershipRequestsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationMembershipRequestsArgs.md)\>

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\>[]\>

A promise that resolves to an array of membership request documents found in the database. These documents represent the membership requests related to the organization.

## See

 - MembershipRequest - The MembershipRequest model used to interact with the membership requests collection in the database.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/membershipRequests.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Organization/membershipRequests.ts#L16)
