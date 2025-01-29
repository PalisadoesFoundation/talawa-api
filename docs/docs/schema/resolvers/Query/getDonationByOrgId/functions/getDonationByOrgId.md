[**talawa-api**](../../../../README.md)

***

# Function: getDonationByOrgId()

> **getDonationByOrgId**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[]\>

This query fetch the donation as a transaction for an organization from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetDonationByOrgIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetDonationByOrgIdArgs.md), `"orgId"`\>

An object that contains `orgId` of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[]\>

A `donation` object.

## Defined in

[src/resolvers/Query/getDonationByOrgId.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/getDonationByOrgId.ts#L10)
