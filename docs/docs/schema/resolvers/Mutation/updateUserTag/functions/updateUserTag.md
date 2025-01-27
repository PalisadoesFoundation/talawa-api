[**talawa-api**](../../../../README.md)

***

# Function: updateUserTag()

> **updateUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

Updates an existing tag's name based on provided input, including validation and authorization checks.

This function updates the name of an existing tag in the database. It performs various checks to ensure that the current user is authorized to update the tag, validates that the new tag name is not the same as the old one, and ensures that no other tag with the same name exists under the same parent tag. It then updates the tag's name and returns the updated tag.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateUserTagArgs.md), `"input"`\>

The arguments passed to the GraphQL mutation, including the tag's `id` and the new `name` for the tag.

### context

`any`

Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

The updated tag with its new name.

## Defined in

[src/resolvers/Mutation/updateUserTag.ts:29](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/updateUserTag.ts#L29)
