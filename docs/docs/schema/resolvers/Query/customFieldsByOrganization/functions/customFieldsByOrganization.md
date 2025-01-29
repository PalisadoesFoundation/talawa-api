[**talawa-api**](../../../../README.md)

***

# Function: customFieldsByOrganization()

> **customFieldsByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>[]\>

This query will fetch all the custom Fields for the organization in the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryCustomFieldsByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryCustomFieldsByOrganizationArgs.md), `"id"`\>

An object that contains `id` of the organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>[]\>

An object `CustomFields` that contains all the custom fields of the specified organization.
The following checks are made:
 1. if the organization exists

## Defined in

[src/resolvers/Query/customFieldsByOrganization.ts:15](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/customFieldsByOrganization.ts#L15)
