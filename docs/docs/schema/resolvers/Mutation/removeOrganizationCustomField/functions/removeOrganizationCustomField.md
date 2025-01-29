[Admin Docs](/)

***

# Function: removeOrganizationCustomField()

> **removeOrganizationCustomField**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>\>

This function enables an admin to remove an organization colleciton field.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveOrganizationCustomFieldArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveOrganizationCustomFieldArgs.md), `"organizationId"` \| `"customFieldId"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>\>

Deleted Organization Custom Field.

## Remarks

The following checks are done:
1. If the user exists
2. If the organization exists.
3. If the user is an admin for the organization.
4. If the custom field to be removed exists
5. If the user has appUserProfile

## Defined in

[src/resolvers/Mutation/removeOrganizationCustomField.ts:36](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/removeOrganizationCustomField.ts#L36)
