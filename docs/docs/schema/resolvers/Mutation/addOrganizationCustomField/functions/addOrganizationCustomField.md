[**talawa-api**](../../../../README.md)

***

# Function: addOrganizationCustomField()

> **addOrganizationCustomField**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>\>

Mutation resolver to add a custom field to an organization.

This function allows an admin to add a new custom field to the collection of fields for a specified organization. It performs several checks:

1. Verifies the existence of the user.
2. Checks if the user has an application profile.
3. Confirms that the organization exists.
4. Ensures that the user is an admin for the organization or has super admin privileges.
5. Validates that the name and type of the custom field are provided.

If any of these conditions are not met, appropriate errors are thrown.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddOrganizationCustomFieldArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddOrganizationCustomFieldArgs.md), `"type"` \| `"organizationId"` \| `"name"`\>

The arguments provided with the request, including:
  - `organizationId`: The ID of the organization to which the custom field will be added.
  - `name`: The name of the new custom field.
  - `type`: The type of the new custom field.

### context

`any`

The context of the entire application, containing user information and other context-specific data.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OrganizationCustomField`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationCustomField.md)\>\>

A promise that resolves to the newly added custom field object.

## Defined in

[src/resolvers/Mutation/addOrganizationCustomField.ts:46](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/addOrganizationCustomField.ts#L46)
