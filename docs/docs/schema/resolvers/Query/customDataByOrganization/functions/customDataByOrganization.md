[Admin Docs](/)

***

# Function: customDataByOrganization()

> **customDataByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>[]\>

This query will fetch all the customData of the members of the organization in the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryCustomDataByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryCustomDataByOrganizationArgs.md), `"organizationId"`\>

An object that contains `id` of the organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>[]\>

An object `customDatas` that contains all the custom fields of the specified organization.
The following checks are made:
 1. if the organization exists

## Defined in

[src/resolvers/Query/customDataByOrganization.ts:13](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Query/customDataByOrganization.ts#L13)
