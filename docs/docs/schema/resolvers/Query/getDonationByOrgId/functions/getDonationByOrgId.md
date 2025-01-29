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

[src/resolvers/Query/getDonationByOrgId.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getDonationByOrgId.ts#L10)
