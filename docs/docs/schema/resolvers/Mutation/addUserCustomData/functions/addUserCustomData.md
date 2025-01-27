[**talawa-api**](../../../../README.md)

***

# Function: addUserCustomData()

> **addUserCustomData**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>\>

Mutation resolver to add or update custom data for a user within a joined organization.

This function allows a user to add or update a custom field with a name and value for an organization
they are a part of. It performs several checks and operations:

1. Validates that the user exists.
2. Verifies that the organization exists.
3. Checks if user custom data for the given organization already exists.
4. If it exists, updates the custom field; if not, creates a new entry.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddUserCustomDataArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddUserCustomDataArgs.md), `"organizationId"` \| `"dataName"` \| `"dataValue"`\>

The arguments provided with the request, including:
  - `organizationId`: The ID of the organization for which custom data is being added.
  - `dataName`: The name of the custom data field.
  - `dataValue`: The value of the custom data field.

### context

`any`

The context of the entire application, including user information and other context-specific data.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>\>

A promise that resolves to the newly added or updated user custom data object.

## Defined in

[src/resolvers/Mutation/addUserCustomData.ts:34](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/addUserCustomData.ts#L34)
