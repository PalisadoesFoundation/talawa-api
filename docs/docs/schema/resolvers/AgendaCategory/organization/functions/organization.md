[**talawa-api**](../../../../README.md)

***

# Function: organization()

> **organization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

Resolver function for the `organization` field of an `AgendaCategory`.

This function fetches the organization associated with a given agenda category.
It uses the `organizationId` field from the parent `AgendaCategory` object to find the corresponding organization in the database.
The organization details are then returned in a plain JavaScript object format.

## Parameters

### parent

[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)

The parent `AgendaCategory` object. This contains the `organizationId` field, which is used to find the organization.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

A promise that resolves to the organization object found in the database, or `null` if no organization is found.

## Defined in

[src/resolvers/AgendaCategory/organization.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/AgendaCategory/organization.ts#L16)
