[Admin Docs](/)

***

# Function: funds()

> **funds**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[]\>

Resolver function for the `funds` field of an `Organization`.

This function retrieves the funds related to a specific organization.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the ID of the organization.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[]\>

A promise that resolves to the fund documents found in the database. These documents represent the funds related to the organization.

## See

 - Fund - The Fund model used to interact with the funds collection in the database.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/funds.ts:16](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Organization/funds.ts#L16)
