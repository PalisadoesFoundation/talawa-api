[**talawa-api**](../../../../README.md)

***

# Function: createDonation()

> **createDonation**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>\>

Creates a new donation transaction.

This function performs the following actions:
1. Creates a new donation record in the database with the specified details.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateDonationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateDonationArgs.md), `"userId"` \| `"orgId"` \| `"nameOfOrg"` \| `"payPalId"` \| `"nameOfUser"` \| `"amount"`\>

The arguments for the mutation, including:
  - `amount`: The amount of the donation.
  - `nameOfOrg`: The name of the organization receiving the donation.
  - `nameOfUser`: The name of the user making the donation.
  - `orgId`: The ID of the organization receiving the donation.
  - `payPalId`: The PayPal ID associated with the transaction.
  - `userId`: The ID of the user making the donation.

### context

`any`

The context for the mutation, which is not used in this resolver.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>\>

The created donation record.

## Defined in

[src/resolvers/Mutation/createDonation.ts:23](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createDonation.ts#L23)
