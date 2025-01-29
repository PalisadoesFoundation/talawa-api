[**talawa-api**](../../../../README.md)

***

# Function: getDonationById()

> **getDonationById**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>\>

This query will fetch the donation as a transaction from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetDonationByIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetDonationByIdArgs.md), `"id"`\>

An object that contains `id` of the donation.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>\>

A `donation` object.

## Defined in

[src/resolvers/Query/getDonationById.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getDonationById.ts#L11)
