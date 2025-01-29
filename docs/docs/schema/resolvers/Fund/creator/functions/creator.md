[Admin Docs](/)

***

# Function: creator()

> **creator**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Resolver function for the `creator` field of a `Fund`.

This function retrieves the user who created a specific fund.

## Parameters

### parent

[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)

The parent object representing the fund. It contains information about the fund, including the ID of the user who created it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

A promise that resolves to the user document found in the database. This document represents the user who created the fund.

## See

 - User - The User model used to interact with the users collection in the database.
 - FundResolvers - The type definition for the resolvers of the Fund fields.

## Defined in

[src/resolvers/Fund/creator.ts:17](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Fund/creator.ts#L17)
